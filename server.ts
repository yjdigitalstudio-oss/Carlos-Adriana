import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initialGifts, initialWeddingSettings } from './src/defaultData';
import { GiftItem, RealtimeEvent, RegistryData, WeddingSettings } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'registry.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state initialized from file or defaults
let registryData: RegistryData;

function loadData(): RegistryData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.gifts) && parsed.settings) {
        const sanitizedGifts = parsed.gifts.map((g: any) => {
          const clean = { ...g };
          delete clean.price;
          delete clean.currency;
          delete clean.imageUrl;
          return clean;
        });
        const sanitizedData: RegistryData = {
          settings: parsed.settings,
          gifts: sanitizedGifts,
        };
        saveData(sanitizedData);
        return sanitizedData;
      }
    }
  } catch (err) {
    console.error('Error loading data from file, falling back to defaults:', err);
  }

  const initial: RegistryData = {
    settings: { ...initialWeddingSettings },
    gifts: [...initialGifts],
  };
  saveData(initial);
  return initial;
}

function saveData(data: RegistryData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
}

registryData = loadData();

// Connected SSE clients
const sseClients = new Set<Response>();

function broadcast(event: RealtimeEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Routes

  // 1. Get entire registry (gifts + settings)
  app.get('/api/registry', (_req: Request, res: Response) => {
    res.json(registryData);
  });

  // 2. Server-Sent Events (Realtime sync for all invited guests & couple)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Send initial snapshot
    const initialEvent: RealtimeEvent = {
      type: 'initial',
      data: registryData,
    };
    res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

    sseClients.add(res);

    // Keep connection alive with heartbeat comments
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // 3. Mark gift as purchased by guest
  app.post('/api/gifts/:id/purchase', (req: Request, res: Response): void => {
    const { id } = req.params;
    const { guestName, guestEmail, message } = req.body;

    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      res.status(400).json({ error: 'El nombre del invitado es obligatorio.' });
      return;
    }

    const giftIndex = registryData.gifts.findIndex((g) => g.id === id);
    if (giftIndex === -1) {
      res.status(404).json({ error: 'Regalo no encontrado.' });
      return;
    }

    const existingGift = registryData.gifts[giftIndex];
    if (existingGift.status === 'purchased') {
      res.status(409).json({
        error: 'Este regalo ya ha sido seleccionado por otro invitado.',
        gift: existingGift,
      });
      return;
    }

    const updatedGift: GiftItem = {
      ...existingGift,
      status: 'purchased',
      purchasedBy: {
        name: guestName.trim(),
        email: guestEmail ? String(guestEmail).trim() : undefined,
        message: message ? String(message).trim() : undefined,
        date: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    registryData.gifts[giftIndex] = updatedGift;
    saveData(registryData);

    // Broadcast update immediately to all connected browsers
    broadcast({ type: 'gift_updated', gift: updatedGift });

    res.json({ success: true, gift: updatedGift });
  });

  // 4. Admin: Add gift
  app.post('/api/gifts', (req: Request, res: Response): void => {
    const { name, description, category, price, currency, imageUrl, productUrl } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'El nombre del regalo es obligatorio.' });
      return;
    }

    const newGift: GiftItem = {
      id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      description: (description || '').trim(),
      category: (category || 'Hogar & Decoración').trim(),
      price: price !== undefined && price !== '' && !isNaN(Number(price)) ? Number(price) : undefined,
      currency: currency || '€',
      imageUrl: (imageUrl || '').trim(),
      productUrl: (productUrl || '').trim(),
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    registryData.gifts.unshift(newGift);
    saveData(registryData);

    broadcast({ type: 'gift_created', gift: newGift });
    res.status(201).json(newGift);
  });

  // 5. Admin: Edit gift
  app.put('/api/gifts/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const giftIndex = registryData.gifts.findIndex((g) => g.id === id);

    if (giftIndex === -1) {
      res.status(404).json({ error: 'Regalo no encontrado.' });
      return;
    }

    const current = registryData.gifts[giftIndex];
    const { name, description, category, price, currency, imageUrl, productUrl, status } = req.body;

    const updatedGift: GiftItem = {
      ...current,
      name: name !== undefined ? String(name).trim() : current.name,
      description: description !== undefined ? String(description).trim() : current.description,
      category: category !== undefined ? String(category).trim() : current.category,
      price: price !== undefined && price !== '' && !isNaN(Number(price)) ? Number(price) : undefined,
      currency: currency || current.currency || '€',
      imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : current.imageUrl,
      productUrl: productUrl !== undefined ? String(productUrl).trim() : current.productUrl,
      status: status === 'available' || status === 'purchased' ? status : current.status,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to available, clear purchasedBy
    if (status === 'available') {
      delete updatedGift.purchasedBy;
    }

    registryData.gifts[giftIndex] = updatedGift;
    saveData(registryData);

    broadcast({ type: 'gift_updated', gift: updatedGift });
    res.json(updatedGift);
  });

  // 6. Admin: Delete gift
  app.delete('/api/gifts/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const giftIndex = registryData.gifts.findIndex((g) => g.id === id);

    if (giftIndex === -1) {
      res.status(404).json({ error: 'Regalo no encontrado.' });
      return;
    }

    registryData.gifts.splice(giftIndex, 1);
    saveData(registryData);

    broadcast({ type: 'gift_deleted', giftId: id });
    res.json({ success: true });
  });

  // 7. Admin: Toggle status (e.g. un-purchase / revert)
  app.post('/api/gifts/:id/toggle-status', (req: Request, res: Response): void => {
    const { id } = req.params;
    const giftIndex = registryData.gifts.findIndex((g) => g.id === id);

    if (giftIndex === -1) {
      res.status(404).json({ error: 'Regalo no encontrado.' });
      return;
    }

    const current = registryData.gifts[giftIndex];
    const isNowPurchased = current.status === 'available';

    const updatedGift: GiftItem = {
      ...current,
      status: isNowPurchased ? 'purchased' : 'available',
      purchasedBy: isNowPurchased
        ? {
            name: 'Reservado por administración',
            date: new Date().toISOString(),
          }
        : undefined,
      updatedAt: new Date().toISOString(),
    };

    registryData.gifts[giftIndex] = updatedGift;
    saveData(registryData);

    broadcast({ type: 'gift_updated', gift: updatedGift });
    res.json(updatedGift);
  });

  // 8. Admin: Update settings
  app.put('/api/settings', (req: Request, res: Response) => {
    const newSettings: WeddingSettings = {
      ...registryData.settings,
      ...req.body,
    };

    registryData.settings = newSettings;
    saveData(registryData);

    broadcast({ type: 'settings_updated', settings: newSettings });
    res.json(newSettings);
  });

  // 9. Admin: Reset to default samples
  app.post('/api/reset-samples', (_req: Request, res: Response) => {
    registryData = {
      settings: { ...initialWeddingSettings },
      gifts: [...initialGifts],
    };
    saveData(registryData);

    broadcast({ type: 'registry_reset', data: registryData });
    res.json(registryData);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wedding Registry Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

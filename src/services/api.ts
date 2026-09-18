import { GiftItem, RealtimeEvent, RegistryData, WeddingSettings } from '../types';

export async function fetchRegistry(): Promise<RegistryData> {
  const res = await fetch('/api/registry');
  if (!res.ok) {
    throw new Error('No se pudo cargar la lista de regalos');
  }
  return res.json();
}

export function subscribeToRealtimeEvents(
  onEvent: (event: RealtimeEvent) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let eventSource: EventSource | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      onStatusChange?.(false);
      return;
    }

    try {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        onStatusChange?.(true);
      };

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data) as RealtimeEvent;
          onEvent(parsed);
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        onStatusChange?.(false);
        eventSource?.close();
        eventSource = null;

        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 4000);
        }
      };
    } catch (err) {
      console.error('Error establishing SSE:', err);
      onStatusChange?.(false);
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }
  };

  connect();

  // On mobile (iOS Safari / Android), when the browser tab is resumed, reconnect and refresh
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !isClosed) {
      // Refresh state immediately from REST API
      fetchRegistry()
        .then((data) => onEvent({ type: 'initial', data }))
        .catch(() => {});

      // Reconnect SSE if closed
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        connect();
      }
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    onStatusChange?.(false);
  };
}

export async function purchaseGift(
  id: string,
  data: { guestName: string; guestEmail?: string; message?: string }
): Promise<{ success: boolean; gift: GiftItem }> {
  const res = await fetch(`/api/gifts/${id}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al confirmar el regalo');
  }
  return body;
}

export async function createGift(giftData: Partial<GiftItem>): Promise<GiftItem> {
  const res = await fetch('/api/gifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftData),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al crear el regalo');
  }
  return body;
}

export async function updateGift(id: string, giftData: Partial<GiftItem>): Promise<GiftItem> {
  const res = await fetch(`/api/gifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(giftData),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al actualizar el regalo');
  }
  return body;
}

export async function deleteGift(id: string): Promise<void> {
  const res = await fetch(`/api/gifts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error al eliminar el regalo');
  }
}

export async function toggleGiftStatus(id: string): Promise<GiftItem> {
  const res = await fetch(`/api/gifts/${id}/toggle-status`, {
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al cambiar estado del regalo');
  }
  return body;
}

export async function updateSettings(settings: Partial<WeddingSettings>): Promise<WeddingSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al actualizar la configuración');
  }
  return body;
}

export async function resetSamples(): Promise<RegistryData> {
  const res = await fetch('/api/reset-samples', {
    method: 'POST',
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Error al reiniciar la lista de muestra');
  }
  return body;
}

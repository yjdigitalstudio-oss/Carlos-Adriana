import { useState, useEffect, useCallback } from 'react';
import { fetchRegistry, subscribeToRealtimeEvents } from './services/api';
import { initialGifts, initialWeddingSettings } from './defaultData';
import { GiftItem, RealtimeEvent, RegistryData } from './types';
import { GuestRegistry } from './components/GuestRegistry';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [registryData, setRegistryData] = useState<RegistryData>({
    settings: initialWeddingSettings,
    gifts: initialGifts,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<'guest' | 'admin'>('guest');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle incoming real-time events from server
  const handleRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case 'initial':
          setRegistryData(event.data);
          setIsLoading(false);
          break;

        case 'gift_updated':
          setRegistryData((prev) => ({
            ...prev,
            gifts: prev.gifts.map((g) => (g.id === event.gift.id ? event.gift : g)),
          }));
          break;

        case 'gift_created':
          setRegistryData((prev) => {
            if (prev.gifts.some((g) => g.id === event.gift.id)) {
              return prev;
            }
            return {
              ...prev,
              gifts: [event.gift, ...prev.gifts],
            };
          });
          break;

        case 'gift_deleted':
          setRegistryData((prev) => ({
            ...prev,
            gifts: prev.gifts.filter((g) => g.id !== event.giftId),
          }));
          break;

        case 'settings_updated':
          setRegistryData((prev) => ({
            ...prev,
            settings: event.settings,
          }));
          break;

        case 'registry_reset':
          setRegistryData(event.data);
          break;
      }
    },
    []
  );

  // Initial load and Realtime SSE setup
  useEffect(() => {
    // Initial fetch
    fetchRegistry()
      .then((data) => {
        setRegistryData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Initial registry fetch failed, will rely on SSE/defaults:', err);
        setIsLoading(false);
      });

    // Realtime subscription
    const unsubscribe = subscribeToRealtimeEvents(
      handleRealtimeEvent,
      (connected) => setIsConnected(connected)
    );

    return () => {
      unsubscribe();
    };
  }, [handleRealtimeEvent]);

  // Check URL hash & search params for admin mode (supports direct bookmarks and back/forward)
  useEffect(() => {
    const checkUrlForAdmin = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === 'true' ||
        hash === '#admin' ||
        hash === '#gestion' ||
        hash === '#novios'
      ) {
        setViewMode('admin');
      } else if (hash === '#lista' || hash === '' || hash === '#') {
        setViewMode('guest');
      }
    };

    checkUrlForAdmin();
    window.addEventListener('hashchange', checkUrlForAdmin);
    return () => {
      window.removeEventListener('hashchange', checkUrlForAdmin);
    };
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = 'gestion';
    setViewMode('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToGuest = () => {
    window.location.hash = '';
    setViewMode('guest');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guest updates a gift
  const handleGuestGiftPurchased = (updatedGift: GiftItem) => {
    setRegistryData((prev) => ({
      ...prev,
      gifts: prev.gifts.map((g) => (g.id === updatedGift.id ? updatedGift : g)),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-stone-600" />
          <span className="text-xs uppercase tracking-widest font-medium">Cargando lista...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800 selection:bg-rose-100 selection:text-rose-900">
      {viewMode === 'guest' ? (
        <GuestRegistry
          registryData={registryData}
          isConnected={isConnected}
          onGiftPurchased={handleGuestGiftPurchased}
          onEnterAdmin={navigateToAdmin}
          onShowToast={addToast}
        />
      ) : (
        <AdminPanel
          registryData={registryData}
          onExitAdmin={navigateToGuest}
          onShowToast={addToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

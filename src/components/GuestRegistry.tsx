import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  Landmark,
  Sparkles,
  Heart,
  CheckCircle2,
  Lock,
  Wifi,
  Gift,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GiftItem, RegistryData } from '../types';
import { GiftCard } from './GiftCard';
import { GiftPurchaseModal } from './GiftPurchaseModal';
import { BankDetailsModal } from './BankDetailsModal';

interface GuestRegistryProps {
  registryData: RegistryData;
  isConnected: boolean;
  onGiftPurchased: (updatedGift: GiftItem) => void;
  onEnterAdmin: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function GuestRegistry({
  registryData,
  isConnected,
  onGiftPurchased,
  onEnterAdmin,
  onShowToast,
}: GuestRegistryProps) {
  const { settings, gifts } = registryData;

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [hidePurchased, setHidePurchased] = useState(settings.hidePurchasedByDefault ?? true);

  // Modals
  const [selectedGiftForPurchase, setSelectedGiftForPurchase] = useState<GiftItem | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    gifts.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [gifts]);

  // Filtered gifts list
  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      if (hidePurchased && gift.status === 'purchased') {
        return false;
      }
      if (selectedCategory !== 'Todos' && gift.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = gift.name.toLowerCase().includes(query);
        const matchesDesc = gift.description?.toLowerCase().includes(query);
        const matchesCat = gift.category?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [gifts, hidePurchased, selectedCategory, searchTerm]);

  const availableCount = gifts.filter((g) => g.status === 'available').length;
  const purchasedCount = gifts.filter((g) => g.status === 'purchased').length;

  const formattedWeddingDate = useMemo(() => {
    if (!settings.weddingDate) return null;
    try {
      const parts = settings.weddingDate.split('-');
      if (parts.length === 3) {
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return settings.weddingDate;
    } catch {
      return settings.weddingDate;
    }
  }, [settings.weddingDate]);

  return (
    <div className="min-h-screen pb-20">
      {/* Top Navigation Bar - Always visible */}
      <nav className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/70 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-stone-900 text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-none">
              {settings.coupleNames || 'Nuestra Boda'}
            </span>
            <span className="hidden md:inline-block text-stone-300">•</span>
            <span className="hidden md:inline-block text-xs text-stone-500 font-medium">
              19 de Diciembre de 2026
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Bank Button */}
            {(settings.bankInfo?.phone ||
              settings.bankInfo?.binanceId ||
              settings.bankInfo?.bankName ||
              settings.bankInfo?.accountNumber) && (
              <button
                id="nav-bank-details-button"
                onClick={() => setIsBankModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/80 text-stone-700 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Pago Móvil & Banco</span>
                <span className="sm:hidden">Aportes</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Wedding Header & Intro */}
      <header className="pt-8 sm:pt-14 pb-10 sm:pb-12 px-4 text-center relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-rose-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Live Sync Status indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-stone-200/60 shadow-2xs text-[11px] font-medium text-stone-600 mb-6 backdrop-blur-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isConnected ? 'Sincronizado en tiempo real' : 'Conectando...'}</span>
          </div>

          {/* Couple Names - Minimalist, elegant serif typography */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-900 mb-3 text-balance">
            {settings.coupleNames || 'Nuestra Boda'}
          </h1>

          {/* Wedding Date */}
          {formattedWeddingDate && (
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-stone-500 font-medium mb-6">
              {formattedWeddingDate}
            </p>
          )}

          {/* Welcome Message */}
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-lg mb-7 font-light whitespace-pre-line">
            {settings.welcomeMessage}
          </p>

          {/* Bank & Payment Information Trigger */}
          {(settings.bankInfo?.phone ||
            settings.bankInfo?.binanceId ||
            settings.bankInfo?.bankName ||
            settings.bankInfo?.accountNumber) && (
            <div className="flex items-center justify-center">
              <button
                id="open-bank-details-header"
                onClick={() => setIsBankModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200/80 text-stone-800 text-xs font-medium shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Landmark className="w-3.5 h-3.5 text-rose-600" />
                <span>Ver datos de Pago Móvil, Binance y Banco</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Registry Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Sticky Filters & Search Controls */}
        <div className="mb-6 bg-white/85 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="search-gifts-input"
                type="text"
                placeholder="Buscar un regalo por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all"
              />
            </div>

            {/* Toggle: Hide or show purchased gifts */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <label
                htmlFor="toggle-hide-purchased"
                className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer select-none"
              >
                <input
                  id="toggle-hide-purchased"
                  type="checkbox"
                  checked={hidePurchased}
                  onChange={(e) => setHidePurchased(e.target.checked)}
                  className="w-4 h-4 rounded-md border-stone-300 text-stone-900 focus:ring-stone-400 cursor-pointer"
                />
                <span>Ocultar ya comprados</span>
              </label>

              <span className="text-stone-300">|</span>

              <span className="text-xs text-stone-500">
                <strong className="text-stone-800 font-semibold">{availableCount}</strong>{' '}
                disponibles
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3.5 pb-1 mt-2 border-t border-stone-100 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`category-pill-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100/80 hover:bg-stone-200/80 text-stone-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gifts Text List */}
        <div
          id="gifts-list"
          className="flex flex-col gap-3 sm:gap-3.5"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onSelect={(g) => setSelectedGiftForPurchase(g)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty Search / Filter State */}
        {filteredGifts.length === 0 && (
          <div className="py-20 text-center bg-white/70 rounded-3xl border border-stone-200/60 p-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
              <Gift className="w-6 h-6 stroke-[1.2]" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">
              No se encontraron regalos
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              {hidePurchased && purchasedCount > 0
                ? 'Todos los regalos de esta categoría ya han sido seleccionados por otros invitados.'
                : 'Prueba a cambiar los términos de búsqueda o selecciona otra categoría.'}
            </p>
            {hidePurchased && purchasedCount > 0 && (
              <button
                id="show-purchased-empty-btn"
                onClick={() => setHidePurchased(false)}
                className="text-xs font-medium text-stone-800 underline underline-offset-4"
              >
                Ver regalos ya comprados (tachados)
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer with Discreet Admin Access */}
      <footer className="mt-20 pt-10 pb-6 border-t border-stone-200/60 text-center text-xs text-stone-400">
        <p className="mb-3">Hecho con mucho cariño para nuestra boda.</p>
        <button
          id="enter-admin-panel-footer-btn"
          onClick={onEnterAdmin}
          className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-600 transition-colors text-[11px] py-1 px-3 rounded-full hover:bg-stone-200/50 cursor-pointer"
        >
          <Lock className="w-3 h-3 text-stone-400" />
          <span>Acceso de Novios y Regalos</span>
        </button>
      </footer>

      {/* Gift Purchase Modal */}
      <GiftPurchaseModal
        gift={selectedGiftForPurchase}
        settings={settings}
        isOpen={Boolean(selectedGiftForPurchase)}
        onClose={() => setSelectedGiftForPurchase(null)}
        onPurchased={(updatedGift) => {
          onGiftPurchased(updatedGift);
          onShowToast('¡Regalo confirmado! Gracias por tu detalle.', 'success');
        }}
        onOpenBankDetails={() => setIsBankModalOpen(true)}
      />

      {/* Bank Details Modal */}
      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        bankInfo={settings.bankInfo}
      />
    </div>
  );
}

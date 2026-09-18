import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { X, Heart, Sparkles, Check, AlertCircle, ExternalLink, Landmark } from 'lucide-react';
import { GiftItem, WeddingSettings } from '../types';
import { purchaseGift } from '../services/api';

interface GiftPurchaseModalProps {
  gift: GiftItem | null;
  settings: WeddingSettings;
  isOpen: boolean;
  onClose: () => void;
  onPurchased: (updatedGift: GiftItem) => void;
  onOpenBankDetails: () => void;
}

export function GiftPurchaseModal({
  gift,
  settings,
  isOpen,
  onClose,
  onPurchased,
  onOpenBankDetails,
}: GiftPurchaseModalProps) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !gift) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMessage('Por favor, indica tu nombre o familia para que los novios sepan quién hace el regalo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await purchaseGift(gift.id, {
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
        message: message.trim() || undefined,
      });

      // Confetti burst for celebrating
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E8D5D0', '#D4AF37', '#FAF7F2', '#A3B18A'],
      });

      setIsSuccess(true);
      onPurchased(res.gift);
    } catch (err: unknown) {
      console.error('Error during purchase:', err);
      const msg = err instanceof Error ? err.message : 'No se pudo completar la selección del regalo.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGuestName('');
    setGuestEmail('');
    setMessage('');
    setIsSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="purchase-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/90 text-stone-800 my-8"
      >
        <button
          id="close-purchase-modal-button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Elegir regalo para la boda</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200/70 mb-5 shadow-xs">
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block mb-1">
                  {gift.category}
                </span>
                <h3 className="font-serif font-semibold text-stone-900 text-base sm:text-lg leading-snug">
                  {gift.name}
                </h3>
                {gift.description && (
                  <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                    {gift.description}
                  </p>
                )}
              </div>

              {gift.productUrl && (
                <div className="mb-4">
                  <a
                    id="view-store-link-in-modal"
                    href={gift.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium underline underline-offset-4"
                  >
                    <span>Ver modelo o tienda sugerida por la pareja</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <p className="text-xs text-stone-600 mb-5 leading-relaxed bg-rose-50/60 p-3 rounded-xl border border-rose-100">
                Al confirmar, este regalo quedará <strong>tachado y desaparecerá</strong> de la lista pública en tiempo real para evitar que otros invitados lo elijan por duplicado.
              </p>

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-100 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="guest-name-input" className="block text-xs font-medium text-stone-700 mb-1">
                    Tu nombre o familia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="guest-name-input"
                    type="text"
                    required
                    placeholder="Ej. Carmen y Javier, Familia Ruiz..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:border-stone-400 placeholder:text-stone-400 shadow-xs"
                  />
                </div>

                <div>
                  <label htmlFor="guest-email-input" className="block text-xs font-medium text-stone-700 mb-1">
                    Tu correo electrónico <span className="text-stone-400">(opcional, para enviarte el comprobante)</span>
                  </label>
                  <input
                    id="guest-email-input"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:border-stone-400 placeholder:text-stone-400 shadow-xs"
                  />
                </div>

                <div>
                  <label htmlFor="guest-message-input" className="block text-xs font-medium text-stone-700 mb-1">
                    Dedicatoria o mensaje para los novios <span className="text-stone-400">(opcional)</span>
                  </label>
                  <textarea
                    id="guest-message-input"
                    rows={3}
                    placeholder="¡Os deseamos toda la felicidad del mundo en esta nueva etapa! Con mucho cariño..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:border-stone-400 placeholder:text-stone-400 shadow-xs resize-none"
                  />
                </div>

                {(settings.bankInfo?.phone ||
                  settings.bankInfo?.binanceId ||
                  settings.bankInfo?.bankName ||
                  settings.bankInfo?.accountNumber) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      id="toggle-bank-info-button"
                      onClick={onOpenBankDetails}
                      className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1.5 transition-colors underline underline-offset-4 cursor-pointer"
                    >
                      <Landmark className="w-3.5 h-3.5 text-rose-600" />
                      <span>¿Deseas enviar tu aporte por Pago Móvil, Binance o Banco? Ver datos</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    id="cancel-purchase-button"
                    onClick={handleClose}
                    className="sm:w-1/3 py-3 px-4 rounded-2xl bg-stone-200/70 hover:bg-stone-300/70 text-stone-700 text-sm font-medium transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    id="confirm-purchase-button"
                    disabled={isSubmitting || !guestName.trim()}
                    className="sm:w-2/3 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Confirmar y reservar regalo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 px-2"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
                <Heart className="w-8 h-8 fill-rose-500 stroke-none" />
              </div>

              <h3 className="font-serif text-2xl font-semibold text-stone-900 mb-2">
                ¡Muchísimas gracias, {guestName}!
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed max-w-md mx-auto mb-6">
                Tu regalo <strong>"{gift.name}"</strong> ha sido tachado y reservado con éxito. Ya no aparecerá disponible para otros invitados para evitar compras repetidas.
              </p>

              {message && (
                <div className="bg-white/80 p-4 rounded-2xl border border-stone-200/70 text-xs italic text-stone-700 mb-6 max-w-sm mx-auto shadow-xs">
                  "{message}"
                </div>
              )}

              {(settings.bankInfo?.phone ||
                settings.bankInfo?.binanceId ||
                settings.bankInfo?.bankName ||
                settings.bankInfo?.accountNumber) && (
                <div className="mb-6 p-4 rounded-2xl bg-white/90 border border-stone-200/80 max-w-sm mx-auto text-left shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-rose-600" /> Pago Móvil / Binance / Banco
                    </span>
                    <button
                      id="view-bank-details-from-success"
                      onClick={onOpenBankDetails}
                      className="text-xs text-rose-700 font-medium hover:underline cursor-pointer"
                    >
                      Ver datos
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Puedes realizar tu aporte directamente usando nuestros datos de Pago Móvil Provincial, Binance o Transferencia.
                  </p>
                </div>
              )}

              <button
                id="close-success-purchase-modal"
                onClick={handleClose}
                className="py-3 px-8 rounded-2xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors shadow-md"
              >
                Volver a la lista
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

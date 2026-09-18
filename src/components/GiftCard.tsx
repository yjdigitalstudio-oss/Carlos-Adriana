import { motion } from 'motion/react';
import { ExternalLink, Check, ShoppingBag, EyeOff, Edit2, Tag } from 'lucide-react';
import { GiftItem } from '../types';

interface GiftCardProps {
  key?: string;
  gift: GiftItem;
  onSelect: (gift: GiftItem) => void;
  isAdmin?: boolean;
  onEdit?: (gift: GiftItem) => void;
  onToggleStatus?: (giftId: string) => void;
}

export function GiftCard({ gift, onSelect, isAdmin, onEdit, onToggleStatus }: GiftCardProps) {
  const isPurchased = gift.status === 'purchased';

  // Category subtle pastel badge styles
  const getCategoryColor = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('cocina') || lower.includes('mesa')) return 'bg-[#F4ECE4] text-[#8C6D53] border-[#EADACF]';
    if (lower.includes('electro')) return 'bg-[#EBF1F5] text-[#557187] border-[#DCE4EC]';
    if (lower.includes('dormitorio') || lower.includes('lino')) return 'bg-[#F2EBF0] text-[#7A5B74] border-[#E6D9E3]';
    if (lower.includes('viaje') || lower.includes('luna')) return 'bg-[#ECEFF0] text-[#577277] border-[#D9E1E3]';
    if (lower.includes('baño') || lower.includes('hogar')) return 'bg-[#EBF2EB] text-[#557758] border-[#D8E6D9]';
    return 'bg-[#F5F2EC] text-[#786E5E] border-[#E9E4DC]';
  };

  return (
    <motion.article
      id={`gift-row-${gift.id}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.96,
        filter: 'blur(4px)',
        transition: {
          duration: 0.45,
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      transition={{
        layout: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
        duration: 0.25,
      }}
      className={`group rounded-2xl bg-white border p-4 sm:p-5 shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isPurchased
          ? 'border-stone-200/60 bg-stone-50/60 opacity-75'
          : 'border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Text Info */}
      <div className="flex-1 min-w-0 pr-0 md:pr-4">
        {/* Category & Status badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide border ${getCategoryColor(
              gift.category
            )}`}
          >
            <Tag className="w-2.5 h-2.5 opacity-60" />
            <span>{gift.category}</span>
          </span>

          {isPurchased ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md">
              <Check className="w-3 h-3 stroke-[2.5]" />
              <span>Ya seleccionado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Disponible</span>
            </span>
          )}
        </div>

        {/* Gift Name */}
        <h3
          className={`font-serif text-base sm:text-lg font-semibold leading-snug transition-colors ${
            isPurchased
              ? 'text-stone-400 line-through decoration-stone-400 decoration-1'
              : 'text-stone-900 group-hover:text-stone-800'
          }`}
        >
          {gift.name}
        </h3>

        {/* Gift Description */}
        {gift.description && (
          <p
            className={`text-xs sm:text-sm leading-relaxed mt-1 ${
              isPurchased ? 'text-stone-400' : 'text-stone-600'
            }`}
          >
            {gift.description}
          </p>
        )}

        {/* Store Reference link if present */}
        {gift.productUrl && !isPurchased && (
          <div className="mt-2.5">
            <a
              id={`gift-store-link-${gift.id}`}
              href={gift.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors group/link"
            >
              <span className="underline underline-offset-4 group-hover/link:text-stone-900">
                Ver detalle o modelo en tienda
              </span>
              <ExternalLink className="w-3 h-3 text-stone-400 group-hover/link:text-stone-700" />
            </a>
          </div>
        )}

        {/* Note if gifted */}
        {isPurchased && gift.purchasedBy && (
          <p className="text-[11px] text-stone-400 italic mt-2">
            Regalado con cariño por: <span className="font-medium text-stone-500">{gift.purchasedBy.name}</span>
          </p>
        )}
      </div>

      {/* Action CTA */}
      <div className="shrink-0 flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
        {!isAdmin ? (
          <div>
            {!isPurchased ? (
              <button
                id={`select-gift-button-${gift.id}`}
                onClick={() => onSelect(gift)}
                className="w-full sm:w-auto min-h-[44px] py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-rose-200" />
                <span>Elegir este regalo</span>
              </button>
            ) : (
              <div className="w-full sm:w-auto py-2 px-4 rounded-xl bg-stone-100 text-stone-400 text-xs font-medium border border-stone-200/60 flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Tachado / No disponible</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id={`admin-edit-gift-${gift.id}`}
              onClick={() => onEdit?.(gift)}
              className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              id={`admin-toggle-status-${gift.id}`}
              onClick={() => onToggleStatus?.(gift.id)}
              className={`flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                isPurchased
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
              title={isPurchased ? 'Marcar como disponible' : 'Marcar como comprado'}
            >
              {isPurchased ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Liberar</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tachar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { GiftItem } from '../types';

interface AdminGiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftToEdit: GiftItem | null;
  onSave: (giftData: Partial<GiftItem>) => Promise<void>;
}

const CATEGORIES = [
  'Cocina & Mesa',
  'Electrodomésticos',
  'Dormitorio',
  'Baño & Hogar',
  'Hogar & Decoración',
  'Luna de Miel & Viaje',
  'Experiencias',
  'Otros',
];

export function AdminGiftFormModal({
  isOpen,
  onClose,
  giftToEdit,
  onSave,
}: AdminGiftFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [productUrl, setProductUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (giftToEdit) {
      setName(giftToEdit.name);
      setDescription(giftToEdit.description || '');
      setCategory(giftToEdit.category || CATEGORIES[0]);
      setProductUrl(giftToEdit.productUrl || '');
    } else {
      setName('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setProductUrl('');
    }
    setError(null);
  }, [giftToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del regalo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        productUrl: productUrl.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el regalo';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="admin-gift-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200/90 text-stone-800 my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/70">
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">
              {giftToEdit ? 'Editar Regalo' : 'Añadir Nuevo Regalo'}
            </h3>
            <p className="text-xs text-stone-500">
              Lista en texto para la boda (sin fotos ni precios)
            </p>
          </div>
          <button
            id="close-admin-gift-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-100 text-rose-800 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label htmlFor="gift-name-input" className="block font-medium text-stone-700 mb-1">
              Nombre del regalo <span className="text-rose-500">*</span>
            </label>
            <input
              id="gift-name-input"
              type="text"
              required
              placeholder="Ej. Batería de cocina de acero inoxidable"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="gift-category-select" className="block font-medium text-stone-700 mb-1">
              Categoría
            </label>
            <select
              id="gift-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 shadow-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gift-desc-input" className="block font-medium text-stone-700 mb-1">
              Descripción o detalles
            </label>
            <textarea
              id="gift-desc-input"
              rows={3}
              placeholder="Detalles sobre modelo, color, medidas o uso sugerido..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 shadow-xs resize-none"
            />
          </div>

          <div>
            <label htmlFor="gift-product-url-input" className="block font-medium text-stone-700 mb-1">
              Enlace de tienda o web sugerida (opcional)
            </label>
            <input
              id="gift-product-url-input"
              type="url"
              placeholder="https://tienda.com/articulo..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-stone-400 shadow-xs"
            />
          </div>

          <div className="pt-3 flex gap-2.5">
            <button
              type="button"
              id="cancel-admin-gift-btn"
              onClick={onClose}
              className="w-1/3 py-2.5 px-4 rounded-xl bg-stone-200/70 hover:bg-stone-300/70 text-stone-700 text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-admin-gift-btn"
              disabled={isSubmitting || !name.trim()}
              className="w-2/3 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar regalo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

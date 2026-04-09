import type { Product } from '../types/product';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';
import ProductImageDisplay from './ProductImageDisplay';

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddedToCart?: () => void;
}

function ProductModal({ product, open, onClose, onAddedToCart }: Props) {
  const { addItem } = useCart();
  const [observation, setObservation] = useState('');

  if (!open || !product) return null;

  const currentProduct = product;

  function handleAdd() {
    addItem(currentProduct, observation || undefined);
    setObservation('');
    onAddedToCart?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 pb-0 sm:pb-0">
      <div className="relative max-w-lg w-full sm:rounded-3xl rounded-t-3xl bg-white shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/90 shadow-md hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        <div className="h-36 sm:h-44 shrink-0 overflow-hidden">
          <ProductImageDisplay
            product={currentProduct}
            priority
            containerClassName="h-44 w-full"
            initialsClassName="text-3xl"
            imgClassName="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {currentProduct.name}
            </h2>
            <p className="text-sm text-slate-600">{currentProduct.description}</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="observation"
              className="block text-xs font-medium text-slate-700 uppercase tracking-wide"
            >
              Special instructions
            </label>
            <textarea
              id="observation"
              rows={3}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="e.g. no granola, extra strawberries..."
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-lg text-primaryDark">
              $ {currentProduct.price.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-full bg-primary text-white font-semibold text-sm px-6 py-2.5 shadow-md hover:bg-primaryDark transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductModal;

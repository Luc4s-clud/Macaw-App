import type { Product } from '../types/product';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-w-lg w-full rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-full bg-white/80 shadow hover:bg-white"
        >
          <X className="w-4 h-4 text-slate-700" />
        </button>

        <div className="h-44 overflow-hidden">
          <img
            src={currentProduct.imageUrl}
            alt={currentProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-5 space-y-4">
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

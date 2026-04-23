import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import ProductImageDisplay from './ProductImageDisplay';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SALES_TAX_RATE = 0.06;
const SERVICE_FEE = 1.5;

function CartDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { items, total, changeQuantity, removeItem } = useCart();
  const salesTax = Number((total * SALES_TAX_RATE).toFixed(2));
  const finalTotal = Number((total + salesTax + SERVICE_FEE).toFixed(2));

  if (!open) return null;

  function handleCheckout() {
    onClose();
    navigate('/checkout');
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <div className="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Your cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-slate-500">
              Your cart is empty. Add a delicious bowl!
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-slate-100 p-3"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                <ProductImageDisplay
                  product={item.product}
                  containerClassName="w-16 h-16"
                  initialsClassName="text-sm"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900">
                      {item.product.name}
                    </p>
                    {item.observation && (
                      <p className="text-xs text-slate-500 truncate">
                        {item.observation}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-full hover:bg-slate-100 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.id, item.quantity - 1)
                      }
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        changeQuantity(item.id, item.quantity + 1)
                      }
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-primaryDark">
                    $
                    {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold text-lg text-primaryDark">
              $ {total.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Sales tax (6%)</span>
            <span className="font-medium text-slate-800">$ {salesTax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Service fee</span>
            <span className="font-medium text-slate-800">$ {SERVICE_FEE.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2">
            <span className="text-slate-700 font-medium">Order total</span>
            <span className="font-semibold text-lg text-primaryDark">
              $ {finalTotal.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={handleCheckout}
            className="w-full rounded-full bg-primary text-white font-semibold py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PENDING_KEY = 'macaw_pending_square_order';

/**
 * Página de retorno após pagamento no checkout hospedado da Square (redirect_url).
 * Limpa o carrinho quando reconhece o pedido (URL ou sessão).
 */
function CheckoutCompletePage() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl =
      searchParams.get('orderId') ||
      searchParams.get('order_id') ||
      searchParams.get('checkoutId');
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
    } catch {
      pending = null;
    }
    const resolved = fromUrl || pending;
    if (pending) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {
        /* ignore */
      }
    }
    if (resolved) {
      setOrderId(resolved);
      clear();
    }
    setReady(true);
  }, [searchParams, clear]);

  if (!ready) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 text-center text-slate-600">
        Loading…
      </section>
    );
  }

  if (orderId) {
    return (
      <section className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Order received
        </h1>
        <p className="text-slate-600">
          Thank you! Your order number is{' '}
          <span className="font-mono font-semibold text-primaryDark">{orderId}</span>
        </p>
        <p className="text-sm text-slate-500">
          Payment was processed securely by Square.
        </p>
        <Link
          to="/menu"
          className="inline-block rounded-full bg-primary text-white font-semibold px-6 py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors"
        >
          Back to menu
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
      <h1 className="font-display text-2xl font-semibold text-slate-900">
        Checkout
      </h1>
      <p className="text-slate-600">
        If you just finished paying on Square, your order may take a moment to appear in the
        system. You can return to the menu or contact us if something looks wrong.
      </p>
      <Link
        to="/menu"
        className="inline-block rounded-full bg-primary text-white font-semibold px-6 py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors"
      >
        Back to menu
      </Link>
    </section>
  );
}

export default CheckoutCompletePage;

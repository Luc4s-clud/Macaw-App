import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { ApiError } from '../services/api/client';
import ProductImageDisplay from '../components/ProductImageDisplay';
import { useSquareCardPayments } from '../hooks/useSquareCardPayments';
import { squareCheckoutMode } from '../config/env';

const PENDING_ORDER_KEY = 'macaw_pending_square_order';
const SALES_TAX_RATE = 0.06;
const SERVICE_FEE = 1.5;

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const hostedCheckout = squareCheckoutMode() === 'hosted';
  const {
    containerRef: squareCardContainerRef,
    ready: squareCardReady,
    loadError: squareLoadError,
    tokenize: squareTokenize,
    configured: squarePayConfigured,
  } = useSquareCardPayments({ enabled: !hostedCheckout });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('pickup');
  const [deliveryAddressLine1, setDeliveryAddressLine1] = useState('');
  const [deliveryAddressLine2, setDeliveryAddressLine2] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [publicOrderCode, setPublicOrderCode] = useState<string | null>(null);
  const salesTax = Number((total * SALES_TAX_RATE).toFixed(2));
  const finalTotal = Number((total + salesTax + SERVICE_FEE).toFixed(2));

  useEffect(() => {
    if (items.length === 0 && !orderId) {
      navigate('/menu', { replace: true });
    }
  }, [items.length, navigate, orderId]);

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const labelClass = 'block text-slate-700 text-sm font-medium mb-1';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name || !phone) {
      setError('Please enter your name and phone number.');
      return;
    }
    if (
      fulfillmentType === 'delivery' &&
      (!deliveryAddressLine1.trim() ||
        !deliveryCity.trim() ||
        !deliveryState.trim() ||
        !deliveryPostalCode.trim())
    ) {
      setError('Please fill delivery address, city, state (2 letters) and ZIP code.');
      return;
    }
    if (!hostedCheckout && squarePayConfigured && !squareCardReady) {
      setError('Wait for the card form to load, then try again.');
      return;
    }

    setSubmitting(true);
    try {
      let paymentSourceId: string | undefined;
      if (!hostedCheckout && squarePayConfigured) {
        paymentSourceId = await squareTokenize();
      }

      const payload = items.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        observation: item.observation ?? null,
      }));
      const res = await createOrder(payload, {
        customerName: name,
        customerPhone: phone,
        ...(customerEmail.trim() && { customerEmail: customerEmail.trim() }),
        fulfillmentType,
        ...(fulfillmentType === 'delivery' && {
          deliveryAddressLine1: deliveryAddressLine1.trim(),
          deliveryAddressLine2: deliveryAddressLine2.trim(),
          deliveryCity: deliveryCity.trim(),
          deliveryState: deliveryState.trim().toUpperCase().slice(0, 2),
          deliveryPostalCode: deliveryPostalCode.trim(),
        }),
        ...(orderNote.trim() && { orderNote: orderNote.trim() }),
        ...(paymentSourceId && { paymentSourceId }),
        ...(hostedCheckout && { hostedCheckout: true }),
      });

      if (hostedCheckout && res.checkoutUrl) {
        try {
          sessionStorage.setItem(
            PENDING_ORDER_KEY,
            JSON.stringify({
              orderId: res.orderId,
              publicOrderCode: res.publicOrderCode ?? null,
              paymentLinkId: res.paymentLinkId ?? null,
              checkoutUrl: res.checkoutUrl,
            })
          );
        } catch {
          /* ignore */
        }
        window.location.assign(res.checkoutUrl);
        return;
      }

      setOrderId(res.orderId);
      setPublicOrderCode(res.publicOrderCode ?? null);
      setPaymentId(res.paymentId ?? null);
      clear();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not place order. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <section className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Order received
        </h1>
        <p className="text-slate-600">
          Thank you! Your order number is{' '}
          <span className="font-mono font-semibold text-primaryDark">
            {publicOrderCode || orderId}
          </span>
        </p>
        {paymentId && (
          <p className="text-sm text-slate-600">
            Payment confirmed{' '}
            <span className="font-mono text-slate-800">{paymentId}</span>
          </p>
        )}
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
    <section className="max-w-3xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
          Checkout
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {hostedCheckout
            ? 'Review your order, then you will be redirected to Square to pay securely.'
            : 'Review your order and enter your contact details.'}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-3 order-2 lg:order-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order summary
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-3 max-h-[min(50vh,420px)] overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <ProductImageDisplay
                    product={item.product}
                    containerClassName="w-14 h-14"
                    initialsClassName="text-xs"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  {item.observation && (
                    <p className="text-xs text-slate-500 line-clamp-2">{item.observation}</p>
                  )}
                  <p className="text-slate-600 mt-0.5">
                    ×{item.quantity} · $
                    {(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-lg font-semibold text-primaryDark pt-2 border-t border-slate-200">
            <span>Subtotal</span>
            <span>$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-700">
            <span>Sales tax (6%)</span>
            <span>$ {salesTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-700">
            <span>Service fee</span>
            <span>$ {SERVICE_FEE.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold text-primaryDark pt-2 border-t border-slate-200">
            <span>Order total</span>
            <span>$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-4 order-1 lg:order-2 rounded-2xl border border-slate-200 bg-white/90 p-5 sm:p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contact
          </h2>
          <div>
            <label htmlFor="co-name" className={labelClass}>
              Full name <span className="text-red-600">*</span>
            </label>
            <input
              id="co-name"
              type="text"
              autoComplete="name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="co-phone" className={labelClass}>
              Phone <span className="text-red-600">*</span>
            </label>
            <input
              id="co-phone"
              type="tel"
              autoComplete="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Fulfillment <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  fulfillmentType === 'pickup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pick up
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  fulfillmentType === 'delivery'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>
          {fulfillmentType === 'delivery' && (
            <>
              <div>
                <label htmlFor="co-address-1" className={labelClass}>
                  Address line 1 <span className="text-red-600">*</span>
                </label>
                <input
                  id="co-address-1"
                  type="text"
                  autoComplete="address-line1"
                  required
                  value={deliveryAddressLine1}
                  onChange={(e) => setDeliveryAddressLine1(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="co-address-2" className={labelClass}>
                  Address line 2 (optional)
                </label>
                <input
                  id="co-address-2"
                  type="text"
                  autoComplete="address-line2"
                  value={deliveryAddressLine2}
                  onChange={(e) => setDeliveryAddressLine2(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label htmlFor="co-city" className={labelClass}>
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="co-state" className={labelClass}>
                    State <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="co-state"
                    type="text"
                    autoComplete="address-level1"
                    required
                    maxLength={2}
                    placeholder="FL"
                    value={deliveryState}
                    onChange={(e) =>
                      setDeliveryState(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="co-zip" className={labelClass}>
                    ZIP code <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="co-zip"
                    type="text"
                    autoComplete="postal-code"
                    required
                    value={deliveryPostalCode}
                    onChange={(e) => setDeliveryPostalCode(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <label htmlFor="co-email" className={labelClass}>
              Email (optional)
            </label>
            <input
              id="co-email"
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="co-note" className={labelClass}>
              Order notes (optional)
            </label>
            <textarea
              id="co-note"
              rows={3}
              maxLength={500}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Pickup time, allergies, etc."
            />
            <p className="text-xs text-slate-500 mt-1">{orderNote.length}/500</p>
          </div>

          {!hostedCheckout && squarePayConfigured && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Card payment
              </h2>
              <p className="text-xs text-slate-500">
                Pay securely with Square. Your card details are not stored on our servers.
              </p>
              {squareLoadError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {squareLoadError}
                </p>
              )}
              <div
                ref={squareCardContainerRef}
                className="min-h-[56px] rounded-xl border border-slate-200 bg-white p-3"
              />
              {!squareCardReady && !squareLoadError && (
                <p className="text-xs text-slate-500">Loading card form…</p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={
                submitting ||
                items.length === 0 ||
                (!hostedCheckout && squarePayConfigured && !squareCardReady)
              }
              className="flex-1 rounded-full bg-primary text-white font-semibold py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? hostedCheckout
                  ? 'Redirecting to Square…'
                  : squarePayConfigured
                    ? 'Processing payment…'
                    : 'Placing order…'
                : hostedCheckout
                  ? `Continue to pay $ ${finalTotal.toFixed(2)}`
                  : squarePayConfigured
                    ? `Pay $ ${finalTotal.toFixed(2)}`
                    : `Place order · $ ${finalTotal.toFixed(2)}`}
            </button>
            <Link
              to="/menu"
              className="text-center rounded-full border border-slate-300 text-slate-700 font-medium py-2.5 text-sm hover:bg-slate-50 transition-colors px-4"
            >
              Continue shopping
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CheckoutPage;

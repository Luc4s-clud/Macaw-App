import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getOrderStatus, type OrderStatusResponse } from '../services/api';

const PENDING_KEY = 'macaw_pending_square_order';

function statusLabel(status: OrderStatusResponse['status'] | null): string {
  if (status === 'paid') return 'Ready';
  if (status === 'authorized') return 'Payment authorized';
  if (status === 'pending') return 'Awaiting payment confirmation';
  if (status === 'in_progress') return 'In progress';
  if (status === 'failed') return 'Failed';
  if (status === 'canceled') return 'Canceled';
  if (status === 'unknown') return 'Status unavailable';
  return 'Checking payment status...';
}

function statusBadgeClass(status: OrderStatusResponse['status'] | null): string {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'authorized') return 'bg-sky-100 text-sky-800 border-sky-200';
  if (status === 'pending') return 'bg-orange-100 text-orange-800 border-orange-200';
  if (status === 'in_progress') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'failed') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'canceled') return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function buildEstimatedTime(createdAt?: string | null): { window: string; remaining: string } | null {
  if (!createdAt) return null;
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return null;
  const minReady = new Date(createdMs + 25 * 60 * 1000);
  const maxReady = new Date(createdMs + 30 * 60 * 1000);
  const now = Date.now();
  const minutesLeft = Math.ceil((maxReady.getTime() - now) / (60 * 1000));
  const window = `${minReady.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${maxReady.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (minutesLeft > 0) return { window, remaining: `About ${minutesLeft} min remaining` };
  return { window, remaining: 'Estimated window reached' };
}

/**
 * Página de retorno após pagamento no checkout hospedado da Square (redirect_url).
 * Limpa o carrinho quando reconhece o pedido (URL ou sessão).
 */
function CheckoutCompletePage() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [publicOrderCode, setPublicOrderCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [statusData, setStatusData] = useState<OrderStatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get('orderId') || searchParams.get('order_id');
    let pendingOrderId: string | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { orderId?: string; publicOrderCode?: string };
          pendingOrderId = typeof parsed?.orderId === 'string' ? parsed.orderId : raw;
          if (typeof parsed?.publicOrderCode === 'string' && parsed.publicOrderCode.trim()) {
            setPublicOrderCode(parsed.publicOrderCode.trim().toUpperCase());
          }
        } catch {
          // backward compatibility: antes era salvo como string simples
          pendingOrderId = raw;
        }
      }
    } catch {
      pendingOrderId = null;
    }
    // No retorno do checkout hospedado, a URL pode trazer parâmetros que não
    // representam exatamente o order_id da Square. Priorizamos o ID salvo ao
    // criar o payment link e usamos a URL apenas como fallback.
    const resolved = pendingOrderId || fromUrl;
    if (pendingOrderId) {
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

  useEffect(() => {
    if (!orderId) return undefined;
    const currentOrderId = orderId;
    let cancelled = false;
    let timerId: number | undefined;
    let attempts = 0;
    const maxAttempts = 10;

    async function loadStatus() {
      setRefreshing(true);
      try {
        const data = await getOrderStatus(currentOrderId);
        if (cancelled) return;
        setStatusData(data);
        if (data.publicOrderCode) {
          setPublicOrderCode(data.publicOrderCode);
        }
        setStatusError(null);
        attempts += 1;
        if (
          data.status !== 'paid' &&
          data.status !== 'failed' &&
          data.status !== 'canceled' &&
          attempts < maxAttempts
        ) {
          timerId = window.setTimeout(loadStatus, 3000);
        }
      } catch (err) {
        if (cancelled) return;
        attempts += 1;
        const rawMessage =
          err instanceof Error
            ? err.message
            : 'Could not refresh payment status right now.';
        const normalized = rawMessage.toUpperCase();
        const notFound =
          normalized.includes('NOT_FOUND') || normalized.includes('RESOURCE NOT FOUND');
        setStatusError(
          notFound
            ? 'We are processing your order. Status may take a few moments to appear.'
            : 'Could not refresh status right now. Please try again shortly.'
        );
        if (!notFound && attempts < maxAttempts) {
          timerId = window.setTimeout(loadStatus, 4000);
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [orderId, refreshTick]);

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
          <span className="font-mono font-semibold text-primaryDark">
            {publicOrderCode || orderId}
          </span>
        </p>
        <p className="text-sm text-slate-500">
          Payment was processed securely by Square.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
          <p className="text-sm font-medium text-slate-800">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusBadgeClass(
                statusData?.status ?? null
              )}`}
            >
              {statusLabel(statusData?.status ?? null)}
            </span>
          </p>
          {(statusData?.status === 'pending' ||
            statusData?.status === 'authorized' ||
            statusData?.status === 'in_progress') &&
            (() => {
              const eta = buildEstimatedTime(statusData?.createdAt || statusData?.updatedAt);
              if (!eta) return null;
              return (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p className="font-semibold">Estimated time: 25-30 minutes</p>
                  <p>Estimated window: {eta.window}</p>
                  <p>{eta.remaining}</p>
                </div>
              );
            })()}
          {statusData?.paymentId && (
            <p className="mt-1 text-xs text-slate-600">
              Payment ID: <span className="font-mono">{statusData.paymentId}</span>
            </p>
          )}
          {statusError && <p className="mt-1 text-xs text-amber-700">{statusError}</p>}
          <button
            type="button"
            onClick={() => setRefreshTick((v) => v + 1)}
            disabled={refreshing}
            className="mt-3 inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {refreshing ? 'Refreshing...' : 'Refresh status'}
          </button>
        </div>
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

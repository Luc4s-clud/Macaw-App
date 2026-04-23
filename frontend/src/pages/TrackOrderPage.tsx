import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  getOrderStatus,
  lookupOrdersByCustomer,
  type OrderLookupItem,
  type OrderStatusResponse,
} from '../services/api';

const ORDER_CODE_CACHE_KEY = 'macaw_order_code_cache_v1';

function statusLabel(status: OrderStatusResponse['status']): string {
  if (status === 'paid') return 'Ready';
  if (status === 'authorized') return 'Payment authorized';
  if (status === 'pending') return 'Awaiting payment confirmation';
  if (status === 'in_progress') return 'In progress';
  if (status === 'failed') return 'Failed';
  if (status === 'canceled') return 'Canceled';
  return 'Status unavailable';
}

function statusFromLookup(item: OrderLookupItem): string {
  if (item.status !== 'unknown') return statusLabel(item.status);
  const state = String(item.orderState || '').toUpperCase();
  const fulfillment = String(item.fulfillmentType || '').toUpperCase();
  if (state === 'OPEN' && (fulfillment === 'PICKUP' || fulfillment === 'DELIVERY')) {
    return 'In progress';
  }
  if (state === 'OPEN') return 'Payment confirmed';
  if (state === 'DRAFT') return 'Awaiting payment confirmation';
  if (state === 'CANCELED') return 'Payment canceled';
  if (state === 'COMPLETED') return 'Payment confirmed';
  return 'Status unavailable';
}

function statusBadgeClass(status: OrderStatusResponse['status']): string {
  if (status === 'paid') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'authorized') return 'bg-sky-100 text-sky-800 border-sky-200';
  if (status === 'pending') return 'bg-orange-100 text-orange-800 border-orange-200';
  if (status === 'in_progress') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (status === 'failed') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (status === 'canceled') return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function normalizeLookupStatus(item: OrderLookupItem): OrderStatusResponse['status'] {
  if (item.status !== 'unknown') return item.status;
  const state = String(item.orderState || '').toUpperCase();
  const fulfillment = String(item.fulfillmentType || '').toUpperCase();
  if (state === 'OPEN' && (fulfillment === 'PICKUP' || fulfillment === 'DELIVERY')) return 'in_progress';
  if (state === 'OPEN') return 'paid';
  if (state === 'DRAFT') return 'pending';
  if (state === 'CANCELED') return 'canceled';
  if (state === 'COMPLETED') return 'paid';
  return 'unknown';
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

function readOrderCodeCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ORDER_CODE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeOrderCodeCache(updates: Record<string, string>) {
  try {
    const current = readOrderCodeCache();
    const merged = { ...current, ...updates };
    localStorage.setItem(ORDER_CODE_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // ignore localStorage issues
  }
}

function TrackOrderPage() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [pollOrderId, setPollOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [lookupItems, setLookupItems] = useState<OrderLookupItem[]>([]);
  const [statusData, setStatusData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => orderIdInput.trim().length > 0, [orderIdInput]);
  const canLookup = useMemo(
    () => customerName.trim().length > 0 || customerEmail.trim().length > 0,
    [customerName, customerEmail]
  );

  async function fetchStatus(orderId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderStatus(orderId);
      setStatusData(data);
      // Mantém o mesmo identificador consultado (ex.: MW000003) para que
      // os próximos polls continuem usando o endpoint correto por código público.
      setPollOrderId(orderId);
      setLookupItems([]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not check order status.';
      setError(message);
      // Mantém o último status exibido quando uma atualização pontual falhar.
      setPollOrderId(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = orderIdInput.trim();
    if (!normalized) {
      setError('Please enter the order code.');
      return;
    }
    const normalizedCode = normalized.toUpperCase();
    const isPublicCode = /^MW\d{6,}$/i.test(normalizedCode);
    const requestId = isPublicCode
      ? normalizedCode
      : (() => {
          const cachedOrderId = readOrderCodeCache()[normalizedCode];
          const listedOrderId =
            lookupItems.find((item) => item.publicOrderCode?.toUpperCase() === normalizedCode)
              ?.orderId ?? null;
          return cachedOrderId || listedOrderId || normalized;
        })();
    setTrackedOrderId(normalized);
    setPollOrderId(requestId);
    fetchStatus(requestId);
  }

  async function handleLookupSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canLookup) {
      setError('Please enter at least a name or email.');
      return;
    }
    setLoading(true);
    setError(null);
    setStatusData(null);
    setTrackedOrderId(null);
    setPollOrderId(null);
    try {
      const result = await lookupOrdersByCustomer({
        name: customerName,
        email: customerEmail,
      });
      setLookupItems(result.items);
      const mappingUpdates: Record<string, string> = {};
      for (const item of result.items) {
        if (item.publicOrderCode && item.orderId) {
          mappingUpdates[item.publicOrderCode.toUpperCase()] = item.orderId;
        }
      }
      if (Object.keys(mappingUpdates).length > 0) {
        writeOrderCodeCache(mappingUpdates);
      }
      if (result.items.length === 0) {
        setError('No recent order found with these details.');
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not search orders right now.';
      setError(message);
      setLookupItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!pollOrderId || !statusData) return undefined;
    if (statusData.status === 'paid' || statusData.status === 'failed' || statusData.status === 'canceled') {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      fetchStatus(pollOrderId);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [pollOrderId, statusData]);

  return (
    <section className="max-w-2xl mx-auto px-4 py-10 sm:py-12 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">
          Track order
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your order code (e.g. MW000001) to check the latest payment status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div>
          <label htmlFor="track-order-id" className="block text-sm font-medium text-slate-700 mb-1">
            Order code
          </label>
          <input
            id="track-order-id"
            type="text"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Ex.: MW000001"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono text-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-full bg-primary text-white font-semibold px-5 py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Check status'}
          </button>
          <Link
            to="/menu"
            className="rounded-full border border-slate-300 text-slate-700 font-medium px-5 py-2.5 text-sm hover:bg-slate-50 transition-colors text-center"
          >
            Back to menu
          </Link>
        </div>
      </form>

      <form
        onSubmit={handleLookupSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
      >
        <p className="text-sm font-semibold text-slate-700">Don't have the order code?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lookup-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              id="lookup-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
          <div>
            <label htmlFor="lookup-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="lookup-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!canLookup || loading}
          className="rounded-full bg-primary text-white font-semibold px-5 py-2.5 text-sm shadow-md hover:bg-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Find orders by name/email'}
        </button>
      </form>

      {trackedOrderId && (statusData || error) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-2">
          {trackedOrderId && (
            <p className="text-sm text-slate-600">
              Searched code:{' '}
              <span className="font-mono text-slate-900">
                {statusData?.publicOrderCode || trackedOrderId}
              </span>
            </p>
          )}
          {statusData?.orderId && (
            <p className="text-xs text-slate-500">
              ID Square: <span className="font-mono">{statusData.orderId}</span>
            </p>
          )}
          {statusData && (
            <>
              <p className="text-base font-semibold text-slate-900">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusBadgeClass(
                    statusData.status
                  )}`}
                >
                  {statusLabel(statusData.status)}
                </span>
              </p>
              {(statusData.status === 'pending' ||
                statusData.status === 'authorized' ||
                statusData.status === 'in_progress') &&
                (() => {
                  const eta = buildEstimatedTime(statusData.createdAt || statusData.updatedAt);
                  if (!eta) return null;
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <p className="font-semibold">Estimated time: 25-30 minutes</p>
                      <p>Estimated window: {eta.window}</p>
                      <p>{eta.remaining}</p>
                    </div>
                  );
                })()}
              {statusData.paymentId && (
                <p className="text-xs text-slate-600">
                  Payment ID: <span className="font-mono">{statusData.paymentId}</span>
                </p>
              )}
              {statusData.updatedAt && (
                <p className="text-xs text-slate-500">
                  Updated at: {new Date(statusData.updatedAt).toLocaleString()}
                </p>
              )}
            </>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
      {lookupItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-700">Found orders</p>
          {lookupItems.map((item) => (
            <button
              key={item.orderId}
              type="button"
              onClick={() => {
                const shownId = item.publicOrderCode || item.orderId;
                setOrderIdInput(shownId);
                setTrackedOrderId(shownId);
                // Para pedidos recuperados por busca (nome/e-mail), evita polling automático
                // para não gerar erro em IDs legados não resolvíveis por /orders/{id}.
                setPollOrderId(null);
                setError(null);
                setStatusData({
                  orderId: item.orderId,
                  publicOrderCode: item.publicOrderCode ?? null,
                  orderState: item.orderState,
                  createdAt: item.createdAt,
                  paymentId: null,
                  paymentStatus: item.paymentStatus,
                  status: item.status,
                  updatedAt: item.createdAt,
                });
              }}
              className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              <p className="text-xs text-slate-500 font-mono">
                {item.publicOrderCode || item.orderId}
              </p>
              {item.publicOrderCode ? (
                <p className="text-xs text-slate-500">
                  Customer code: <span className="font-mono">{item.publicOrderCode}</span>
                </p>
              ) : (
                <p className="text-xs text-amber-700">
                  Customer code is not available yet (use the Square ID temporarily).
                </p>
              )}
              <p className="text-sm font-medium text-slate-800">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                    normalizeLookupStatus(item)
                  )}`}
                >
                  {statusFromLookup(item)}
                </span>
              </p>
              {item.createdAt && (
                <p className="text-xs text-slate-500">
                  Created at: {new Date(item.createdAt).toLocaleString()}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default TrackOrderPage;

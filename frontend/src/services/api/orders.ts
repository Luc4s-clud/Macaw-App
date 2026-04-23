import { requireApiUrl } from '../../config/env';
import { apiRequest } from './client';
import type {
  CreateOrderCheckoutFields,
  CreateOrderItemInput,
  OrderLookupResponse,
  CreateOrderResponse,
  OrderStatusResponse,
} from './types';

/**
 * Cria o pedido no Square com os itens enviados.
 * Retorna orderId para uso no fluxo de pagamento.
 */
export async function createOrder(
  items: CreateOrderItemInput[],
  checkout?: CreateOrderCheckoutFields
): Promise<CreateOrderResponse> {
  if (!items.length) {
    throw new Error('O pedido deve ter pelo menos um item.');
  }
  const baseUrl = requireApiUrl();
  return apiRequest<CreateOrderResponse>('/api/orders', baseUrl, {
    method: 'POST',
    body: {
      items,
      ...(checkout?.customerName && { customerName: checkout.customerName }),
      ...(checkout?.customerPhone && { customerPhone: checkout.customerPhone }),
      ...(checkout?.customerEmail && { customerEmail: checkout.customerEmail }),
      ...(checkout?.orderNote?.trim() && { orderNote: checkout.orderNote.trim() }),
      ...(checkout?.fulfillmentType && { fulfillmentType: checkout.fulfillmentType }),
      ...(checkout?.deliveryAddressLine1 && { deliveryAddressLine1: checkout.deliveryAddressLine1 }),
      ...(checkout?.deliveryAddressLine2 && { deliveryAddressLine2: checkout.deliveryAddressLine2 }),
      ...(checkout?.deliveryCity && { deliveryCity: checkout.deliveryCity }),
      ...(checkout?.deliveryState && { deliveryState: checkout.deliveryState }),
      ...(checkout?.deliveryPostalCode && { deliveryPostalCode: checkout.deliveryPostalCode }),
      ...(checkout?.paymentSourceId && { paymentSourceId: checkout.paymentSourceId }),
      ...(checkout?.hostedCheckout === true && { hostedCheckout: true }),
    },
    timeoutMs: 15_000,
  });
}

/**
 * Consulta o status atual do pedido/pagamento na Square via backend.
 */
export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const normalizedOrderId = orderId.trim();
  if (!normalizedOrderId) {
    throw new Error('orderId é obrigatório para consultar status.');
  }
  const baseUrl = requireApiUrl();
  const isPublicCode = /^MW\d{6,}$/i.test(normalizedOrderId);
  const path = isPublicCode
    ? `/api/orders/code/${encodeURIComponent(normalizedOrderId.toUpperCase())}/status`
    : `/api/orders/${encodeURIComponent(normalizedOrderId)}/status`;
  return apiRequest<OrderStatusResponse>(
    path,
    baseUrl,
    {
      method: 'GET',
      timeoutMs: 10_000,
    }
  );
}

export async function lookupOrdersByCustomer(params: {
  name?: string;
  email?: string;
}): Promise<OrderLookupResponse> {
  const name = params.name?.trim() ?? '';
  const email = params.email?.trim() ?? '';
  if (!name && !email) {
    throw new Error('Informe nome ou e-mail para buscar pedidos.');
  }
  const search = new URLSearchParams();
  if (name) search.set('name', name);
  if (email) search.set('email', email);
  const baseUrl = requireApiUrl();
  return apiRequest<OrderLookupResponse>(
    `/api/orders/lookup/search?${search.toString()}`,
    baseUrl,
    { method: 'GET', timeoutMs: 15_000 }
  );
}

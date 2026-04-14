import { requireApiUrl } from '../../config/env';
import { apiRequest } from './client';
import type {
  CreateOrderCheckoutFields,
  CreateOrderItemInput,
  CreateOrderResponse,
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
      ...(checkout?.paymentSourceId && { paymentSourceId: checkout.paymentSourceId }),
    },
    timeoutMs: 15_000,
  });
}

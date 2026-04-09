import { requireApiUrl } from '../../config/env';
import { apiRequest } from './client';
import type { CreateOrderItemInput, CreateOrderResponse } from './types';

/**
 * Cria o pedido no Square com os itens enviados.
 * Retorna orderId para uso no fluxo de pagamento.
 */
export async function createOrder(
  items: CreateOrderItemInput[]
): Promise<CreateOrderResponse> {
  if (!items.length) {
    throw new Error('O pedido deve ter pelo menos um item.');
  }
  const baseUrl = requireApiUrl();
  return apiRequest<CreateOrderResponse>('/api/orders', baseUrl, {
    method: 'POST',
    body: { items },
    timeoutMs: 15_000,
  });
}

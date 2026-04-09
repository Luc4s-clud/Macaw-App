/**
 * Tipos da API (menu e pedidos).
 */

export interface ApiMenuItem {
  id: string;
  squareVariationId?: string;
  squareItemId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export interface CreateOrderItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string | null;
}

export interface CreateOrderResponse {
  orderId: string;
  order: { id: string; [key: string]: unknown };
}

export interface MenuResponse {
  items: ApiMenuItem[];
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

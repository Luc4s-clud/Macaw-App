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
  publicOrderCode?: string | null;
  order?: { id: string; [key: string]: unknown };
  /** Presente quando o pagamento com cartão foi processado no Square. */
  paymentId?: string;
  /** URL do checkout hospedado (Payment Link), quando hostedCheckout foi usado. */
  checkoutUrl?: string;
  /** ID do Payment Link retornado pela Square (hosted checkout). */
  paymentLinkId?: string | null;
}

/** Campos opcionais enviados junto com os itens no checkout */
export interface CreateOrderCheckoutFields {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderNote?: string;
  fulfillmentType?: 'delivery' | 'pickup';
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  /** Estado (US), 2 letras — obrigatório com delivery */
  deliveryState?: string;
  deliveryPostalCode?: string;
  /** Token do Web Payments SDK (obrigatório quando o checkout exige pagamento online). */
  paymentSourceId?: string;
  /** Checkout hospedado pela Square (Payment Link); exige CHECKOUT_SUCCESS_URL no backend. */
  hostedCheckout?: boolean;
}

export interface OrderStatusResponse {
  orderId: string;
  publicOrderCode?: string | null;
  orderState: string | null;
  createdAt?: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  status: 'paid' | 'authorized' | 'pending' | 'in_progress' | 'failed' | 'canceled' | 'unknown';
  updatedAt: string | null;
}

export interface OrderLookupItem {
  orderId: string;
  publicOrderCode?: string | null;
  createdAt: string | null;
  orderState: string | null;
  fulfillmentType: string | null;
  status: 'paid' | 'authorized' | 'pending' | 'in_progress' | 'failed' | 'canceled' | 'unknown';
  paymentStatus: string | null;
}

export interface OrderLookupResponse {
  items: OrderLookupItem[];
}

export interface MenuResponse {
  items: ApiMenuItem[];
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

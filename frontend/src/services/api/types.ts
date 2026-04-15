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
  order?: { id: string; [key: string]: unknown };
  /** Presente quando o pagamento com cartão foi processado no Square. */
  paymentId?: string;
  /** URL do checkout hospedado (Payment Link), quando hostedCheckout foi usado. */
  checkoutUrl?: string;
}

/** Campos opcionais enviados junto com os itens no checkout */
export interface CreateOrderCheckoutFields {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderNote?: string;
  /** Token do Web Payments SDK (obrigatório quando o checkout exige pagamento online). */
  paymentSourceId?: string;
  /** Checkout hospedado pela Square (Payment Link); exige CHECKOUT_SUCCESS_URL no backend. */
  hostedCheckout?: boolean;
}

export interface MenuResponse {
  items: ApiMenuItem[];
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

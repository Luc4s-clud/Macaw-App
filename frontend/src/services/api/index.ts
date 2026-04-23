/**
 * API do backend (Square: menu e pedidos).
 * Use getMenu() e createOrder(); o client não é exposto.
 */

export { getMenu, prefetchMenu } from './menu';
export { createOrder, getOrderStatus, lookupOrdersByCustomer } from './orders';
export { ApiError } from './client';
export type {
  ApiMenuItem,
  CreateOrderItemInput,
  CreateOrderResponse,
  OrderLookupItem,
  OrderLookupResponse,
  OrderStatusResponse,
  MenuResponse,
} from './types';

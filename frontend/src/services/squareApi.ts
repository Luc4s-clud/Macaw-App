/**
 * Reexporta a API do backend (Square).
 * Prefira importar de '@/services/api' ou 'services/api'.
 */

export {
  getMenu,
  prefetchMenu,
  createOrder,
  ApiError,
} from './api';
export type {
  ApiMenuItem,
  CreateOrderItemInput,
  CreateOrderResponse,
} from './api';

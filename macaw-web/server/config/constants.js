/**
 * Limites e constantes para validação e segurança.
 */

export const ORDER_LIMITS = {
  MAX_ITEMS: 50,
  MAX_QUANTITY_PER_ITEM: 20,
  MAX_NAME_LENGTH: 200,
  MAX_OBSERVATION_LENGTH: 500,
  MIN_PRICE_CENTS: 0,
  MAX_PRICE_CENTS: 999_99, // 999.99 USD
};

export const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minuto
  limit: 100, // requisições por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
};

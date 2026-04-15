/**
 * Validação da URL da API no frontend.
 * Falha em tempo de build/load se estiver em uso e não configurada.
 */

const API_URL = import.meta.env.VITE_API_URL;

function getApiUrl(): string {
  const url = typeof API_URL === 'string' ? API_URL.trim() : '';
  return url;
}

/** URL base da API (backend). Vazia se não configurada. */
export const apiBaseUrl = getApiUrl();

/**
 * Garante que a API está configurada antes de chamar endpoints que a usam.
 * Use em funções que fazem fetch para a API.
 */
export function requireApiUrl(): string {
  if (!apiBaseUrl) {
    throw new Error(
      'VITE_API_URL não está definida. Configure no .env (ex: VITE_API_URL=http://localhost:3001).'
    );
  }
  return apiBaseUrl;
}

/** Application ID do Square (público) — Web Payments SDK no checkout. */
const SQUARE_APP = import.meta.env.VITE_SQUARE_APPLICATION_ID;
/** Location ID (mesmo do backend). */
const SQUARE_LOC = import.meta.env.VITE_SQUARE_LOCATION_ID;
const SQUARE_VITE_ENV = import.meta.env.VITE_SQUARE_ENV;

export function squareApplicationId(): string {
  return typeof SQUARE_APP === 'string' ? SQUARE_APP.trim() : '';
}

export function squareLocationId(): string {
  return typeof SQUARE_LOC === 'string' ? SQUARE_LOC.trim() : '';
}

/** sandbox | production — define a URL do script do Web Payments SDK. */
export function squarePaymentsEnv(): 'sandbox' | 'production' {
  return SQUARE_VITE_ENV === 'production' ? 'production' : 'sandbox';
}

export function isSquarePaymentsConfigured(): boolean {
  return Boolean(squareApplicationId() && squareLocationId());
}

/** `hosted` = Payment Link (redirect para a Square). `inline` = Web Payments SDK no site (padrão). */
export type SquareCheckoutMode = 'hosted' | 'inline';

export function squareCheckoutMode(): SquareCheckoutMode {
  const m = import.meta.env.VITE_SQUARE_CHECKOUT;
  return m === 'hosted' ? 'hosted' : 'inline';
}

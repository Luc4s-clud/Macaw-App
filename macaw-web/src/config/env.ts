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

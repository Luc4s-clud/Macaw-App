import { requireApiUrl } from '../../config/env';
import { apiRequest } from './client';
import type { ApiMenuItem, MenuResponse } from './types';

/**
 * Busca o menu do Square via backend.
 * Validação básica da resposta: items é array.
 */
export async function getMenu(): Promise<ApiMenuItem[]> {
  const baseUrl = requireApiUrl();
  const data = await apiRequest<MenuResponse>('/api/menu', baseUrl, {
    method: 'GET',
    timeoutMs: 20_000,
  });
  if (!Array.isArray(data?.items)) {
    throw new Error('Resposta inválida do menu.');
  }
  return data.items;
}

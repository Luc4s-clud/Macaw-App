import { requireApiUrl } from '../../config/env';
import {
  collectMenuImageHrefs,
  injectImagePreloads,
  preconnectToImageOrigin,
} from '../../utils/menuImagePreload';
import { apiRequest } from './client';
import type { ApiMenuItem, MenuResponse } from './types';

/** Antecipa DNS/TLS e download das primeiras fotos assim que o JSON do menu chega. */
function warmMenuImages(items: ApiMenuItem[]) {
  if (typeof document === 'undefined') return;
  const hrefs = collectMenuImageHrefs(items);
  const first = hrefs[0];
  if (first) preconnectToImageOrigin(first);
  injectImagePreloads(hrefs);
}

let cachedItems: ApiMenuItem[] | null = null;
let inflight: Promise<ApiMenuItem[]> | null = null;
let cachedAtMs = 0;
const MENU_CLIENT_CACHE_TTL_MS = 60_000;

async function fetchMenuFromApi(): Promise<ApiMenuItem[]> {
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

/**
 * Dispara o carregamento do menu em background (cache em memória após sucesso).
 * Útil na abertura do site para a rota /menu abrir já preenchida.
 */
export function prefetchMenu(): void {
  try {
    void getMenu();
  } catch {
    /* requireApiUrl não configurado */
  }
}

/**
 * Menu do Square via backend. Reutiliza o mesmo array em memória após o 1º sucesso.
 */
export async function getMenu(options: { forceRefresh?: boolean } = {}): Promise<ApiMenuItem[]> {
  const { forceRefresh = false } = options;
  const isFresh = Date.now() - cachedAtMs < MENU_CLIENT_CACHE_TTL_MS;
  if (!forceRefresh && cachedItems !== null && isFresh) return cachedItems;
  if (inflight) return inflight;

  inflight = fetchMenuFromApi()
    .then((items) => {
      cachedItems = items;
      cachedAtMs = Date.now();
      warmMenuImages(items);
      return items;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

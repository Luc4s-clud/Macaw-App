/**
 * Cliente HTTP para a API do backend.
 * Timeout, tratamento de erro e sem expor dados sensíveis.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseErrorResponse(res: Response): Promise<{ error: string; details?: unknown }> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      return {
        error: typeof data?.error === 'string' ? data.error : 'Erro na requisição.',
        details: data?.details,
      };
    } catch {
      // ignore
    }
  }
  return { error: res.statusText || 'Erro na requisição.' };
}

export interface RequestConfig {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Fetch com timeout e parsing de erro padronizado.
 */
export async function apiRequest<T>(
  path: string,
  baseUrl: string,
  config: RequestConfig = {}
): Promise<T> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = config;
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const parsed = await parseErrorResponse(res);
      throw new ApiError(parsed.error, res.status, parsed.details);
    }

    if (res.status === 204) {
      return undefined as T;
    }
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new ApiError('Resposta inválida do servidor.', res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new ApiError('A requisição demorou muito. Tente novamente.', 408);
      }
      throw new ApiError(err.message, 0);
    }
    throw new ApiError('Erro desconhecido.', 0);
  }
}

import { requireApiUrl } from '../../config/env';
import { ApiError } from './client';

/**
 * Envia candidatura (multipart: campos + currículo opcional).
 */
export async function submitHiringApplication(formData: FormData): Promise<void> {
  const baseUrl = requireApiUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/api/hiring`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const contentType = res.headers.get('content-type') ?? '';
      let msg = 'Não foi possível enviar a candidatura.';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          if (typeof data?.error === 'string') msg = data.error;
        } catch {
          // ignore
        }
      }
      throw new ApiError(msg, res.status);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('O envio demorou demais. Tente novamente.', 408);
    }
    throw err instanceof Error ? new ApiError(err.message, 0) : new ApiError('Erro desconhecido.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

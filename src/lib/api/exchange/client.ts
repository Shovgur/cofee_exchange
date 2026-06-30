export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-pricing.coffeeexchange.ru'
).replace(/\/$/, '');

/** Обход CORS / mixed-content (HTTPS страница → HTTP API). */
export function buildApiPath(pathAfterApiPrefix: string): string {
  const isBrowser = typeof window !== 'undefined';
  const useProxy = process.env.NEXT_PUBLIC_API_USE_PROXY === 'true';
  const needsProxyForMixedContent =
    isBrowser &&
    API_BASE_URL.startsWith('http:') &&
    window.location.protocol === 'https:';

  if (isBrowser && (useProxy || needsProxyForMixedContent)) {
    return `/api/http-backend-proxy/${pathAfterApiPrefix}`;
  }

  return `${API_BASE_URL}/api/${pathAfterApiPrefix}`;
}

export function parsePrice(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(s) || 0;
}

export async function parseExchangeJson<T>(res: Response): Promise<T> {
  const raw = await res.text();

  if (!res.ok) {
    if (raw.includes('API not configured')) {
      throw new Error(
        'API движка цен не настроен. Укажите NEXT_PUBLIC_API_URL в .env.local',
      );
    }
    if (raw.trimStart().startsWith('<!') || raw.includes('<!DOCTYPE')) {
      throw new Error(
        `Ошибка API (${res.status}): неверный адрес бэкенда. Проверьте NEXT_PUBLIC_API_URL и NEXT_PUBLIC_API_USE_PROXY.`,
      );
    }
    try {
      const body = JSON.parse(raw) as { error?: string; detail?: string | unknown };
      if (typeof body.detail === 'string') throw new Error(body.detail);
      if (typeof body.error === 'string') throw new Error(body.error);
    } catch (e) {
      if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
    }
    throw new Error(raw.slice(0, 200) || `Ошибка API: ${res.status}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('Сервер вернул не JSON');
  }
}

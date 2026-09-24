import {
  clearStoredTokens,
  getStoredTokens,
  refreshStoredAccessToken,
} from '@/lib/api/loyalty/client';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-pricing.coffeeexchange.ru'
).replace(/\/$/, '');

export class ExchangeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'ExchangeApiError';
  }
}

function extractDetail(raw: string): string | undefined {
  try {
    const body = JSON.parse(raw) as { detail?: unknown };
    return typeof body.detail === 'string' ? body.detail : undefined;
  } catch {
    return undefined;
  }
}

/** Сообщение для 403 Pricing (не админ по ADMIN_PHONES). */
export function pricingForbiddenMessage(err: unknown): string | null {
  if (!(err instanceof ExchangeApiError) || err.status !== 403) return null;
  return err.message;
}

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

/**
 * Запрос к /api/v1/admin/* Pricing с Bearer-токеном Loyalty и общим refresh.
 */
export async function exchangeAdminFetch(
  pathAfterApiPrefix: string,
  init: RequestInit = {},
): Promise<Response> {
  const path = pathAfterApiPrefix.replace(/^\//, '');
  const url = buildApiPath(path);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  let tokens = getStoredTokens();
  if (tokens?.access_token) {
    headers.set('Authorization', `Bearer ${tokens.access_token}`);
  }

  let res = await fetch(url, { ...init, headers, cache: 'no-store' });

  if (res.status === 401) {
    const raw = await res.text();
    const detail = extractDetail(raw);

    if (detail === 'Токен истёк' && tokens?.refresh_token) {
      const refreshed = await refreshStoredAccessToken();
      if (refreshed?.access_token) {
        headers.set('Authorization', `Bearer ${refreshed.access_token}`);
        res = await fetch(url, { ...init, headers, cache: 'no-store' });
      } else {
        throw new ExchangeApiError('Сессия истекла. Войдите снова.', 401, detail);
      }
    } else if (detail === 'Недействительный токен') {
      clearStoredTokens();
      throw new ExchangeApiError(detail, 401, detail);
    } else {
      throw new ExchangeApiError(
        detail ?? 'Требуется access-токен администратора Loyalty',
        401,
        detail,
      );
    }
  }

  if (res.status === 403) {
    const raw = await res.text();
    const detail = extractDetail(raw);
    const message =
      detail === 'Доступ только для администраторов'
        ? 'Недостаточно прав. Нужен телефон администратора в списке ADMIN_PHONES.'
        : detail ?? 'Недостаточно прав';
    throw new ExchangeApiError(message, 403, detail);
  }

  return res;
}

export async function exchangeAdminJson<T>(
  pathAfterApiPrefix: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await exchangeAdminFetch(pathAfterApiPrefix, init);
  return parseExchangeJson<T>(res);
}

export function exchangeJson(body: unknown): Pick<RequestInit, 'body' | 'headers'> {
  return {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };
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

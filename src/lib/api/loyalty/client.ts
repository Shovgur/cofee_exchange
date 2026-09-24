import type { ApiErrorBody, ApiTokenPair } from '@/lib/api/loyalty/types';

export const LOYALTY_API_BASE = (
  process.env.NEXT_PUBLIC_LOYALTY_API_URL ?? 'https://api-loyalty.coffeeexchange.ru'
).replace(/\/$/, '');

const TOKENS_KEY = 'ce_loyalty_tokens';

export class LoyaltyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'LoyaltyApiError';
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    return Math.max(1, Math.ceil((date - Date.now()) / 1000));
  }
  return undefined;
}

/** Человекочитаемое сообщение об ошибке API лояльности */
export function loyaltyErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof LoyaltyApiError)) return fallback;

  if (err.status === 429) {
    if (err.retryAfterSeconds != null && err.retryAfterSeconds > 0) {
      return `Слишком частые запросы SMS. Повторите через ${err.retryAfterSeconds} сек.`;
    }
    return (
      err.detail ??
      'Слишком частые запросы SMS. Подождите 1–2 минуты и попробуйте снова.'
    );
  }

  if (err.status === 502) {
    return err.detail ?? 'SMS-сервис временно недоступен. Попробуйте позже.';
  }

  return err.detail ?? err.message ?? fallback;
}

export function buildLoyaltyPath(pathAfterV1: string): string {
  const path = pathAfterV1.replace(/^\//, '');
  const isBrowser = typeof window !== 'undefined';
  const useProxy =
    process.env.NEXT_PUBLIC_LOYALTY_USE_PROXY === 'true' ||
    (isBrowser && process.env.NEXT_PUBLIC_LOYALTY_USE_PROXY !== 'false');

  if (isBrowser && useProxy) {
    return `/api/loyalty-proxy/${path}`;
  }

  return `${LOYALTY_API_BASE}/api/v1/${path}`;
}

export function getStoredTokens(): ApiTokenPair | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiTokenPair;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: ApiTokenPair): void {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    /* ignore */
  }
}

export function clearStoredTokens(): void {
  try {
    localStorage.removeItem(TOKENS_KEY);
  } catch {
    /* ignore */
  }
}

let refreshPromise: Promise<ApiTokenPair | null> | null = null;

/** Одно обновление access-токена на всё приложение (Loyalty + Pricing). */
export async function refreshStoredAccessToken(): Promise<ApiTokenPair | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refresh_token) {
    clearStoredTokens();
    return null;
  }
  if (!refreshPromise) {
    refreshPromise = refreshTokens(tokens.refresh_token).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function parseError(res: Response): Promise<LoyaltyApiError> {
  const retryAfterSeconds = parseRetryAfter(res.headers.get('Retry-After'));
  const raw = await res.text().catch(() => '');
  try {
    const body = JSON.parse(raw) as ApiErrorBody;
    const detail = typeof body.detail === 'string' ? body.detail : raw.slice(0, 200);
    return new LoyaltyApiError(
      detail || `HTTP ${res.status}`,
      res.status,
      detail,
      retryAfterSeconds,
    );
  } catch {
    return new LoyaltyApiError(
      raw.slice(0, 200) || `HTTP ${res.status}`,
      res.status,
      undefined,
      retryAfterSeconds,
    );
  }
}

async function refreshTokens(refreshToken: string): Promise<ApiTokenPair | null> {
  const url = buildLoyaltyPath('auth/refresh');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  });
  if (!res.ok) {
    clearStoredTokens();
    return null;
  }
  const data = (await res.json()) as ApiTokenPair;
  storeTokens(data);
  return data;
}

export async function loyaltyFetch<T>(
  pathAfterV1: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set('Accept', 'application/json');

  let tokens = getStoredTokens();
  if (auth && tokens?.access_token) {
    headers.set('Authorization', `Bearer ${tokens.access_token}`);
  }

  const url = buildLoyaltyPath(pathAfterV1);
  let res = await fetch(url, { ...rest, headers, cache: 'no-store' });

  if (auth && res.status === 401 && tokens?.refresh_token) {
    const refreshed = await refreshStoredAccessToken();
    if (refreshed?.access_token) {
      headers.set('Authorization', `Bearer ${refreshed.access_token}`);
      res = await fetch(url, { ...rest, headers, cache: 'no-store' });
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function loyaltyJson(body: unknown): Pick<RequestInit, 'body' | 'headers'> {
  return {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };
}

export type AdminMediaKind = 'drinks' | 'stores' | 'rules' | 'plugin';

export interface AdminMediaUploadOut {
  url: string;
  content_type: string;
  size: number;
  filename: string;
}

/** Загрузка файла в хранилище лояльности (фото, PDF, плагин). */
export async function loyaltyUploadMedia(
  kind: AdminMediaKind,
  file: File,
): Promise<AdminMediaUploadOut> {
  const tokens = getStoredTokens();
  const form = new FormData();
  form.append('file', file);

  const url = buildLoyaltyPath(`admin/media?kind=${encodeURIComponent(kind)}`);
  const headers: HeadersInit = { Accept: 'application/json' };
  if (tokens?.access_token) {
    headers.Authorization = `Bearer ${tokens.access_token}`;
  }

  const res = await fetch(url, { method: 'POST', headers, body: form, cache: 'no-store' });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as AdminMediaUploadOut;
}

/** Скачивание Excel-выгрузки или другого бинарного ответа. */
export async function loyaltyDownload(
  pathAfterV1: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
): Promise<{ blob: Blob; filename: string }> {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    q.set(key, String(value));
  }
  const qs = q.toString();
  const tokens = getStoredTokens();
  const headers: HeadersInit = {};
  if (tokens?.access_token) {
    headers.Authorization = `Bearer ${tokens.access_token}`;
  }

  const url = buildLoyaltyPath(`${pathAfterV1.replace(/^\//, '')}${qs ? `?${qs}` : ''}`);
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) throw await parseError(res);

  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  const filename = match?.[1]?.trim() || 'export.xlsx';
  return { blob, filename };
}

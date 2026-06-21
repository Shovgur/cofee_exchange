const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Обход mixed-content (HTTPS страница → HTTP API). */
export function buildApiPath(pathAfterApiPrefix: string): string {
  const isBrowser = typeof window !== 'undefined';
  const needsProxy =
    isBrowser &&
    BASE_URL.startsWith('http:') &&
    window.location.protocol === 'https:';
  if (needsProxy) {
    return `/api/http-backend-proxy/${pathAfterApiPrefix}`;
  }
  return `${BASE_URL}/api/${pathAfterApiPrefix}`;
}

export function parsePrice(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(s) || 0;
}

import { fetchAdminSettings } from '@/lib/api/exchange/admin-settings';
import { getStoredTokens } from '@/lib/api/loyalty/client';

const STORAGE_KEY = 'ce_prices_poll_interval_sec';
export const PRICING_SETTINGS_SAVED_EVENT = 'ce-pricing-settings-saved';

const DEFAULT_SEC = 30;
const MIN_SEC = 2;
const MAX_SEC = 600;

function clampSec(n: number): number {
  return Math.min(MAX_SEC, Math.max(MIN_SEC, n));
}

function envIntervalSec(): number | null {
  const raw = process.env.NEXT_PUBLIC_PRICES_POLL_INTERVAL_SEC;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= MIN_SEC ? clampSec(n) : null;
}

export function persistPricingPollIntervalSec(sec: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampSec(sec)));
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PRICING_SETTINGS_SAVED_EVENT));
  }
}

function readStoredIntervalSec(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? clampSec(n) : null;
  } catch {
    return null;
  }
}

/** Интервал опроса цен в меню/ТВ (сек), синхронизируется с Pricing admin settings. */
export async function resolvePricesPollIntervalSec(): Promise<number> {
  const fromEnv = envIntervalSec();
  if (fromEnv != null) return fromEnv;

  const tokens = getStoredTokens();
  if (tokens?.access_token) {
    try {
      const s = await fetchAdminSettings();
      const sec = clampSec(s.price_update_interval_sec);
      persistPricingPollIntervalSec(sec);
      return sec;
    } catch {
      /* fall through */
    }
  }

  return readStoredIntervalSec() ?? DEFAULT_SEC;
}

export interface ApiPriceItem {
  drink_id: string;
  pos_item_id?: string;
  name: string;
  /** Литраж строкой; может отсутствовать, если задан unitCapacity */
  volume?: string;
  /** Объём в литрах (например 0.2) — приоритетно для value/label/sort, если volume нет */
  unitCapacity?: number;
  base_price?: string;
  /** Базовая цена с бэка (альтернатива base_price) */
  defaultSalePrice?: string;
  current_price: string;
  current_pct: string;
  min_pct: string;
  max_pct: string;
  is_fixed: boolean;
  last_bucket: string;
  updated_at: string;
}

export interface ApiPricesResponse {
  prices: ApiPriceItem[];
  settings_version: number;
  updated_at: string;
}

export interface ApiSaleItem {
  pos_item_id: string;
  drink_id: string;
  quantity: number;
  size_id?: string;
}

export interface ApiSaleRequest extends ApiSaleItem {
  sold_at: string;
  source: string;
}

/**
 * Строка в POST /api/v1/sales/batch (пакет искусственных / тестовых продаж).
 */
export interface ApiSaleBatchItem {
  pos_item_id: string;
  size_id: string;
  drink_id: string;
  quantity: number;
}

export interface ApiSaleBatchRequest {
  items: ApiSaleBatchItem[];
  sold_at?: string | null;
  source: string;
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/**
 * Временный обход mixed-content (HTTPS страница → HTTP API).
 * Когда API будет по HTTPS на домене — убрать и собирать URL как `${BASE_URL}/api/...`.
 */
export function buildApiPath(pathAfterApiPrefix: string): string {
  const isBrowser = typeof window !== "undefined";
  const needsProxy =
    isBrowser &&
    BASE_URL.startsWith("http:") &&
    window.location.protocol === "https:";
  if (needsProxy) {
    return `/api/http-backend-proxy/${pathAfterApiPrefix}`;
  }
  return `${BASE_URL}/api/${pathAfterApiPrefix}`;
}

export function parsePrice(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(s) || 0;
}

export async function fetchAllPrices(): Promise<ApiPricesResponse> {
  const url = buildApiPath("v1/prices");
  console.log("[API] fetchAllPrices →", url);
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  console.log(
    "[API] fetchAllPrices ←",
    res.status,
    res.headers.get("content-type"),
  );
  const rawText = await res.text();
  console.log(
    "[API] fetchAllPrices ← body (first 500):",
    rawText.slice(0, 500),
  );
  if (!res.ok) throw new Error(`Ошибка загрузки цен: ${res.status}`);
  try {
    return JSON.parse(rawText) as ApiPricesResponse;
  } catch {
    console.error("[API] fetchAllPrices — не JSON:", rawText.slice(0, 300));
    throw new Error("Сервер вернул не JSON");
  }
}

export async function fetchDrinkPrice(drinkId: string): Promise<ApiPriceItem> {
  const url = buildApiPath(`v1/prices/${encodeURIComponent(drinkId)}`);
  console.log("[API] fetchDrinkPrice →", url);
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  console.log(
    "[API] fetchDrinkPrice ←",
    res.status,
    res.headers.get("content-type"),
  );
  const rawText = await res.text();
  if (!res.ok) {
    console.error("[API] fetchDrinkPrice error:", rawText.slice(0, 300));
    throw new Error(`Ошибка загрузки цены: ${res.status}`);
  }
  try {
    return JSON.parse(rawText) as ApiPriceItem;
  } catch {
    console.error("[API] fetchDrinkPrice — не JSON:", rawText.slice(0, 300));
    throw new Error("Сервер вернул не JSON");
  }
}

// Admin: Settings

export interface ApiAdminSettings {
  id: number;
  version: number;
  price_update_interval_sec: number;
  sales_analysis_window_sec: number;
  neutral_zone_percent: string;
  max_step_up_pct: string;
  max_step_down_pct: string;
  max_step_to_center_pct: string;
  center_return_full_distance_pct: string;
  default_sensitivity: string;
  default_min_pct: string;
  default_max_pct: string;
  price_rounding_step: string;
  fixed_items_affect_market: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAdminSettingsUpdate {
  price_update_interval_sec: number;
  sales_analysis_window_sec: number;
  neutral_zone_percent: number;
  max_step_up_pct: number;
  max_step_down_pct: number;
  max_step_to_center_pct: number;
  center_return_full_distance_pct: number;
  default_sensitivity: number;
  default_min_pct: number;
  default_max_pct: number;
  price_rounding_step: number;
  fixed_items_affect_market: boolean;
}

export interface ApiAdminSettingsHistoryItem {
  id: number;
  version: number;
  created_at: string;
}

export async function fetchAdminSettings(): Promise<ApiAdminSettings> {
  const url = buildApiPath('v1/admin/settings');
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка загрузки настроек: ${res.status}`);
  try { return JSON.parse(raw) as ApiAdminSettings; }
  catch { throw new Error('Сервер вернул не JSON'); }
}

export async function putAdminSettings(payload: ApiAdminSettingsUpdate): Promise<ApiAdminSettings> {
  const url = buildApiPath('v1/admin/settings');
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка сохранения настроек: ${res.status}`);
  try { return JSON.parse(raw) as ApiAdminSettings; }
  catch { throw new Error('Сервер вернул не JSON'); }
}

export async function fetchAdminSettingsHistory(): Promise<ApiAdminSettingsHistoryItem[]> {
  const url = buildApiPath('v1/admin/settings/history');
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка загрузки истории: ${res.status}`);
  try { return JSON.parse(raw) as ApiAdminSettingsHistoryItem[]; }
  catch { throw new Error('Сервер вернул не JSON'); }
}

/** Принудительный пересчёт цен вне расписания */
export async function postAdminRecalc(): Promise<string> {
  const url = buildApiPath('v1/admin/recalc');
  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'text/plain, */*' },
  });
  const raw = await res.text();
  if (!res.ok) {
    const hint = raw.trim() ? ` — ${raw.slice(0, 300)}` : '';
    throw new Error(`Ошибка пересчёта: ${res.status}${hint}`);
  }
  return raw;
}

/** Регистрирует одну продажу (POST /api/v1/sales). */
export async function postSale(payload: ApiSaleRequest): Promise<void> {
  const url = buildApiPath("v1/sales");
  console.log("[API] postSale →", url, payload);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("[API] postSale ←", res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[API] postSale error:", body);
    throw new Error(`Ошибка регистрации продажи: ${res.status}`);
  }
}

/** Регистрирует несколько продаж  */
export async function postSaleBatch(
  payload: ApiSaleBatchRequest,
): Promise<void> {
  const url = buildApiPath("v1/sales/batch");
  console.log("[API] postSaleBatch →", url, payload);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("[API] postSaleBatch ←", res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[API] postSaleBatch error:", body);
    throw new Error(`Ошибка регистрации продаж: ${res.status}`);
  }
}

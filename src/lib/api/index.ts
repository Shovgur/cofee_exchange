export interface ApiPriceItem {
  drink_id: string;
  name: string;
  volume: string;
  base_price: string;
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
}

export interface ApiSaleRequest extends ApiSaleItem {
  sold_at: string;
  source: string;
}

export interface ApiSaleBatchRequest {
  items: ApiSaleItem[];
  sold_at: string;
  source: string;
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/**
 * Временный обход mixed-content (HTTPS страница → HTTP API):`.

 Когда API будет доступен по HTTPS на нормальном домене — убрать эту функцию и снова собирать
  URL только как `${BASE_URL}/api/...`
 */
function buildApiPath(pathAfterApiPrefix: string): string {
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

/** Регистрирует несколько продаж (POST /api/v1/sales/batch). */
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

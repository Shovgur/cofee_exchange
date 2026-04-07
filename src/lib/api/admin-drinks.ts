import { buildApiPath } from '@/lib/api';

// ─── Types (из OpenAPI DrinkRead, DrinkCreate, DrinkUpdate, …) ────────────────

export interface AdminDrinkRead {
  drink_id: string;
  pos_item_id: string | null;
  name: string;
  unitCapacity: number | null;
  is_active: boolean;
  sensitivity: string;
  min_pct: string;
  max_pct: string;
  max_step_up_pct_override: string | null;
  max_step_down_pct_override: string | null;
  max_step_to_center_pct_override: string | null;
  defaultSalePrice: string;
  current_pct: string;
  current_price: string;
  is_fixed: boolean;
  fixed_pct: string | null;
  pending_manual_pct: string | null;
  last_actual_sales: number;
  last_effective_sales: string;
  last_bucket: string | null;
  last_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDrinkCreate {
  name: string;
  pos_item_id?: string | null;
  defaultSalePrice: number | string;
  sensitivity?: number | string | null;
  min_pct?: number | string | null;
  max_pct?: number | string | null;
}

export interface AdminDrinkUpdate {
  name?: string | null;
  sensitivity?: number | string | null;
  min_pct?: number | string | null;
  max_pct?: number | string | null;
  max_step_up_pct_override?: number | string | null;
  max_step_down_pct_override?: number | string | null;
  max_step_to_center_pct_override?: number | string | null;
}

export interface AdminBasePriceUpdate {
  defaultSalePrice: number | string;
}

export interface AdminFixRequest {
  fixed_pct: number | string;
}

export interface AdminManualSetRequest {
  pct: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parseJson<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!res.ok) throw new Error(raw || `Ошибка API: ${res.status}`);
  try { return JSON.parse(raw) as T; }
  catch { throw new Error('Сервер вернул не JSON'); }
}

function json(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchAdminDrinksList(limit = 100, offset = 0): Promise<AdminDrinkRead[]> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const url = `${buildApiPath('v1/admin/drinks')}?${q}`;
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  return parseJson<AdminDrinkRead[]>(res);
}

export async function fetchAdminDrink(drinkId: string): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}`);
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  return parseJson<AdminDrinkRead>(res);
}

export async function createAdminDrink(body: AdminDrinkCreate): Promise<AdminDrinkRead> {
  const res = await fetch(buildApiPath('v1/admin/drinks'), { method: 'POST', ...json(body) });
  return parseJson<AdminDrinkRead>(res);
}

export async function putAdminDrinkProfile(drinkId: string, body: AdminDrinkUpdate): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/profile`);
  const res = await fetch(url, { method: 'PUT', ...json(body) });
  return parseJson<AdminDrinkRead>(res);
}

export async function putAdminDrinkBasePrice(drinkId: string, body: AdminBasePriceUpdate): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/base-price`);
  const res = await fetch(url, { method: 'PUT', ...json(body) });
  return parseJson<AdminDrinkRead>(res);
}

export async function postAdminDrinkFix(drinkId: string, body: AdminFixRequest): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/fix`);
  const res = await fetch(url, { method: 'POST', ...json(body) });
  return parseJson<AdminDrinkRead>(res);
}

export async function postAdminDrinkUnfix(drinkId: string): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/unfix`);
  const res = await fetch(url, { method: 'POST', ...json({}) });
  return parseJson<AdminDrinkRead>(res);
}

export async function postAdminDrinkManualSet(drinkId: string, body: AdminManualSetRequest): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/manual-set`);
  const res = await fetch(url, { method: 'POST', ...json(body) });
  return parseJson<AdminDrinkRead>(res);
}

export async function postAdminDrinkToggleActive(drinkId: string): Promise<AdminDrinkRead> {
  const url = buildApiPath(`v1/admin/drinks/${encodeURIComponent(drinkId)}/toggle-active`);
  const res = await fetch(url, { method: 'POST', ...json({}) });
  return parseJson<AdminDrinkRead>(res);
}

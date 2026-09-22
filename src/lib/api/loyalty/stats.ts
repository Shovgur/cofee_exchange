import { loyaltyFetch } from '@/lib/api/loyalty/client';

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface StatsOverview {
  users_total: number;
  users_new: number;
  receipts_count: number;
  revenue: string;
  average_check: string;
  coupons_issued: number;
  coupons_used: number;
  coupons_revenue_money: string;
  coupons_revenue_beans: number;
  beans_accrued: number;
  beans_spent: number | null;
  beans_expired: number | null;
}

export interface StatsTopDrink {
  pos_item_id: string;
  name: string;
  size_id: string;
  count: number;
  revenue_money: string;
}

export interface StatsTopModifier {
  pos_modifier_id: string;
  name: string;
  count: number;
  revenue_money: string;
}

export interface StatsStoreRow {
  store_id: string;
  name: string;
  receipts_count: number;
  revenue: string;
  beans_accrued: number;
  coupons_used: number;
}

export async function adminStatsOverview(params: {
  date_from?: string;
  date_to?: string;
  store_id?: string;
} = {}): Promise<StatsOverview> {
  const qs = buildQuery(params);
  return loyaltyFetch<StatsOverview>(`admin/stats/overview${qs}`, { auth: true });
}

export async function adminStatsTopDrinks(params: {
  date_from?: string;
  date_to?: string;
  store_id?: string;
  status?: string;
  limit?: number;
} = {}): Promise<StatsTopDrink[]> {
  const qs = buildQuery(params);
  return loyaltyFetch<StatsTopDrink[]>(`admin/stats/top-drinks${qs}`, { auth: true });
}

export async function adminStatsTopModifiers(params: {
  date_from?: string;
  date_to?: string;
  store_id?: string;
  limit?: number;
} = {}): Promise<StatsTopModifier[]> {
  const qs = buildQuery(params);
  return loyaltyFetch<StatsTopModifier[]>(`admin/stats/top-modifiers${qs}`, { auth: true });
}

export async function adminStatsStores(params: {
  date_from?: string;
  date_to?: string;
} = {}): Promise<StatsStoreRow[]> {
  const qs = buildQuery(params);
  return loyaltyFetch<StatsStoreRow[]>(`admin/stats/stores${qs}`, { auth: true });
}

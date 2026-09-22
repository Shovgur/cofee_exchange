import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';

export interface AdminModifierRow {
  id: string;
  country_code: string;
  pos_modifier_id: string;
  name: string;
  base_price: string;
  is_active: boolean;
  count_in_stats: boolean;
}

export interface AdminModifierPage {
  items: AdminModifierRow[];
  total: number;
  limit: number;
  offset: number;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function adminListModifiers(params: {
  country?: string;
  query?: string;
  include_inactive?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminModifierPage> {
  const qs = buildQuery({ ...params, query: params.query?.trim() });
  return loyaltyFetch<AdminModifierPage>(`admin/modifiers${qs}`, { auth: true });
}

export async function adminPatchModifier(
  modifierId: string,
  body: { count_in_stats: boolean },
): Promise<AdminModifierRow> {
  return loyaltyFetch<AdminModifierRow>(`admin/modifiers/${modifierId}`, {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

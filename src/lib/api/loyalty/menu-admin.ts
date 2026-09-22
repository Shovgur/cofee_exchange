import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';
import type { ApiMenuItem } from '@/lib/api/loyalty/types';

export interface AdminMenuItemPage {
  items: ApiMenuItem[];
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

export async function adminListMenuItems(params: {
  country?: string;
  query?: string;
  include_inactive?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminMenuItemPage> {
  const qs = buildQuery({ ...params, query: params.query?.trim() });
  return loyaltyFetch<AdminMenuItemPage>(`admin/menu/items${qs}`, { auth: true });
}

export async function adminPatchMenuItem(
  itemId: string,
  body: Partial<{
    description: string;
    image_url: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>,
): Promise<ApiMenuItem> {
  return loyaltyFetch<ApiMenuItem>(`admin/menu/items/${itemId}`, {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';

export type StoreWorkingHoursDay = { open: string; close: string } | null;

export type StoreWorkingHours = Partial<
  Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', StoreWorkingHoursDay>
>;

export interface ApiStore {
  id: string;
  country_code: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  working_hours: StoreWorkingHours | null;
  phone: string | null;
  photos: string[] | null;
}

export interface AdminStore extends ApiStore {
  external_id: string;
  pos_name: string | null;
  pos_address: string | null;
  is_active: boolean;
  is_published: boolean;
  plugin_version?: string | null;
  plugin_last_seen_at?: string | null;
  plugin_online?: boolean;
  created_at: string;
}

export interface AdminStorePage {
  items: AdminStore[];
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

/** Публичный список опубликованных кофеен для карты в приложении. */
export async function fetchStores(country?: string): Promise<ApiStore[]> {
  const qs = buildQuery({ country });
  return loyaltyFetch<ApiStore[]>(`stores${qs}`);
}

export async function adminListStores(params: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminStorePage> {
  const qs = buildQuery({ ...params, query: params.query?.trim() });
  return loyaltyFetch<AdminStorePage>(`admin/stores${qs}`, { auth: true });
}

export async function adminGetStore(storeId: string): Promise<AdminStore> {
  return loyaltyFetch<AdminStore>(`admin/stores/${storeId}`, { auth: true });
}

export async function adminCreateStore(body: {
  external_id: string;
  country_code?: string;
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  working_hours?: StoreWorkingHours;
  phone?: string;
  is_published?: boolean;
}): Promise<AdminStore> {
  return loyaltyFetch<AdminStore>('admin/stores', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminPatchStore(
  storeId: string,
  body: Partial<{
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    working_hours: StoreWorkingHours;
    phone: string;
    photos: string[];
    is_active: boolean;
    is_published: boolean;
  }>,
): Promise<AdminStore> {
  return loyaltyFetch<AdminStore>(`admin/stores/${storeId}`, {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

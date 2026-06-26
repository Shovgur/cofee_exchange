import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminUserOut {
  id: string;
  phone: string;
  code: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country_code: string;
  is_active: boolean;
  is_blocked: boolean;
  profile_completed: boolean;
}

export interface AdminUserPage {
  items: AdminUserOut[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserCardOut {
  id: string;
  phone: string;
  code: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  birth_date: string | null;
  email: string | null;
  country_code: string;
  is_active: boolean;
  is_blocked: boolean;
  profile_completed: boolean;
  balance: number;
  active_coupons: number;
}

export interface AuthEventOut {
  id: string;
  event: string;
  phone: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BalanceOut {
  balance: number;
}

export interface AdminMessageOut {
  detail: string;
}

export interface ProgramSettingsOut {
  version: number;
  beans_accrual_rate: number;
  bean_ttl_days: number;
  coupon_ttl_days: number;
  created_by: string | null;
  created_at: string | null;
}

export interface SecurityAlertOut {
  id: string;
  alert_type: string;
  subject_type: string;
  subject: string;
  count: number;
  created_at: string;
}

export interface BeanPriceOut {
  id: string;
  price_beans: number;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function adminSearchUsers(params: {
  query: string;
  limit?: number;
  offset?: number;
}): Promise<AdminUserPage> {
  const q = new URLSearchParams({ query: params.query });
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  return loyaltyFetch<AdminUserPage>(`admin/users?${q.toString()}`, { auth: true });
}

export async function adminGetUser(userId: string): Promise<AdminUserCardOut> {
  return loyaltyFetch<AdminUserCardOut>(`admin/users/${userId}`, { auth: true });
}

export async function adminGetUserAuthEvents(
  userId: string,
  limit = 50,
): Promise<AuthEventOut[]> {
  return loyaltyFetch<AuthEventOut[]>(
    `admin/users/${userId}/auth-events?limit=${limit}`,
    { auth: true },
  );
}

export async function adminAccrueBeans(
  userId: string,
  beans: number,
  comment?: string,
): Promise<BalanceOut> {
  return loyaltyFetch<BalanceOut>(`admin/users/${userId}/beans/accrue`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ beans, comment: comment ?? null }),
  });
}

export async function adminSpendBeans(
  userId: string,
  beans: number,
  comment?: string,
): Promise<BalanceOut> {
  return loyaltyFetch<BalanceOut>(`admin/users/${userId}/beans/spend`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ beans, comment: comment ?? null }),
  });
}

export async function adminBlockUser(
  userId: string,
  comment?: string,
): Promise<AdminMessageOut> {
  return loyaltyFetch<AdminMessageOut>(`admin/users/${userId}/block`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ comment: comment ?? null }),
  });
}

export async function adminUnblockUser(
  userId: string,
  comment?: string,
): Promise<AdminMessageOut> {
  return loyaltyFetch<AdminMessageOut>(`admin/users/${userId}/unblock`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ comment: comment ?? null }),
  });
}

// ── Coupons ────────────────────────────────────────────────────────────────

export async function adminCancelCoupon(
  couponId: string,
  comment?: string,
): Promise<AdminMessageOut> {
  return loyaltyFetch<AdminMessageOut>(`admin/coupons/${couponId}/cancel`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ comment: comment ?? null }),
  });
}

// ── Program settings ───────────────────────────────────────────────────────

export async function adminGetProgramSettings(): Promise<ProgramSettingsOut> {
  return loyaltyFetch<ProgramSettingsOut>('admin/settings', { auth: true });
}

export async function adminPutProgramSettings(body: {
  beans_accrual_rate: number;
  bean_ttl_days: number;
  coupon_ttl_days: number;
}): Promise<ProgramSettingsOut> {
  return loyaltyFetch<ProgramSettingsOut>('admin/settings', {
    method: 'PUT',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminGetProgramSettingsHistory(): Promise<ProgramSettingsOut[]> {
  return loyaltyFetch<ProgramSettingsOut[]>('admin/settings/history', { auth: true });
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export async function adminGetAlerts(limit = 50): Promise<SecurityAlertOut[]> {
  return loyaltyFetch<SecurityAlertOut[]>(`admin/alerts?limit=${limit}`, { auth: true });
}

// ── Bean prices ────────────────────────────────────────────────────────────

export async function adminGetItemBeanPrice(itemId: string): Promise<BeanPriceOut> {
  return loyaltyFetch<BeanPriceOut>(`admin/items/${itemId}/bean-price`, { auth: true });
}

export async function adminSetItemBeanPrice(
  itemId: string,
  price_beans: number,
): Promise<BeanPriceOut> {
  return loyaltyFetch<BeanPriceOut>(`admin/items/${itemId}/bean-price`, {
    method: 'PUT',
    auth: true,
    ...loyaltyJson({ price_beans }),
  });
}

export async function adminGetModifierBeanPrice(modifierId: string): Promise<BeanPriceOut> {
  return loyaltyFetch<BeanPriceOut>(`admin/modifiers/${modifierId}/bean-price`, { auth: true });
}

export async function adminSetModifierBeanPrice(
  modifierId: string,
  price_beans: number,
): Promise<BeanPriceOut> {
  return loyaltyFetch<BeanPriceOut>(`admin/modifiers/${modifierId}/bean-price`, {
    method: 'PUT',
    auth: true,
    ...loyaltyJson({ price_beans }),
  });
}

// ── Rules ──────────────────────────────────────────────────────────────────

export async function adminPublishRules(body: {
  country_code: string;
  text: string;
}): Promise<{ country_code: string; version: number; text: string; created_at: string }> {
  return loyaltyFetch('admin/rules', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';
import type {
  ApiCoupon,
  ApiCouponStatus,
  ApiGender,
  ApiLoyaltyTransaction,
  ApiLoyaltyTransactionType,
  ApiPurchaseKind,
} from '@/lib/api/loyalty/types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminUserOut {
  id: string;
  phone: string;
  code: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  gender: ApiGender | null;
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
  gender: ApiGender | null;
  country_code: string;
  is_active: boolean;
  is_blocked: boolean;
  profile_completed: boolean;
  balance: number;
  active_coupons: number;
}

/** Поля профиля, доступные админу для создания/редактирования. */
export interface AdminUserProfileInput {
  first_name?: string;
  last_name?: string;
  middle_name?: string | null;
  birth_date?: string;
  email?: string;
  gender?: ApiGender;
  country_code?: string;
}

export interface AdminCouponOut {
  id: string;
  number: string | null;
  qr_token: string;
  status: ApiCouponStatus;
  purchase_kind: ApiPurchaseKind;
  price_beans: number | null;
  price_money: string | null;
  currency: string;
  country_code: string;
  user_id: string;
  user_phone: string;
  user_code: string;
  created_at: string;
  reserved_at: string | null;
  used_at: string | null;
  expires_at: string;
}

export interface AdminCouponPage {
  items: AdminCouponOut[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminUserCouponPage {
  items: ApiCoupon[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminTransactionPage {
  items: ApiLoyaltyTransaction[];
  total: number;
  limit: number;
  offset: number;
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

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── Users ──────────────────────────────────────────────────────────────────

/** Без `query` возвращает всех пользователей — используется для списка при входе. */
export async function adminSearchUsers(params: {
  query?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminUserPage> {
  const qs = buildQuery({
    query: params.query?.trim(),
    limit: params.limit,
    offset: params.offset,
  });
  return loyaltyFetch<AdminUserPage>(`admin/users${qs}`, { auth: true });
}

export async function adminCreateUser(
  body: AdminUserProfileInput & { phone: string },
): Promise<AdminUserCardOut> {
  return loyaltyFetch<AdminUserCardOut>('admin/users', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminUpdateUser(
  userId: string,
  body: AdminUserProfileInput,
): Promise<AdminUserCardOut> {
  return loyaltyFetch<AdminUserCardOut>(`admin/users/${userId}`, {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminGetUser(userId: string): Promise<AdminUserCardOut> {
  return loyaltyFetch<AdminUserCardOut>(`admin/users/${userId}`, { auth: true });
}

export async function adminGetUserCoupons(
  userId: string,
  params: { status?: ApiCouponStatus; limit?: number; offset?: number } = {},
): Promise<AdminUserCouponPage> {
  const qs = buildQuery({ ...params });
  return loyaltyFetch<AdminUserCouponPage>(`admin/users/${userId}/coupons${qs}`, {
    auth: true,
  });
}

export async function adminGetUserTransactions(
  userId: string,
  params: { type?: ApiLoyaltyTransactionType; limit?: number; offset?: number } = {},
): Promise<AdminTransactionPage> {
  const qs = buildQuery({ ...params });
  return loyaltyFetch<AdminTransactionPage>(`admin/users/${userId}/transactions${qs}`, {
    auth: true,
  });
}

/** Ручная выдача купона: без оплаты и списания Бинов. */
export async function adminIssueCoupon(
  userId: string,
  body: { item_id: string; modifier_ids?: string[] },
): Promise<ApiCoupon> {
  return loyaltyFetch<ApiCoupon>(`admin/users/${userId}/coupons`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ item_id: body.item_id, modifier_ids: body.modifier_ids ?? [] }),
  });
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

/** `search` — по номеру купона или QR-токену. */
export async function adminListCoupons(
  params: {
    status?: ApiCouponStatus;
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<AdminCouponPage> {
  const qs = buildQuery({ ...params, search: params.search?.trim() });
  return loyaltyFetch<AdminCouponPage>(`admin/coupons${qs}`, { auth: true });
}

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

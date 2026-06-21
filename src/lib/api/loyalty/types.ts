/** Типы API лояльности — см. docs/loyalty-api.md */

export interface ApiErrorBody {
  detail: string;
}

export interface ApiTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new: boolean;
}

export interface ApiUserProfile {
  id: string;
  phone: string;
  code: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  birth_date: string | null;
  email: string | null;
  country_code: string;
  consent_version: string | null;
  profile_completed: boolean;
}

export interface ApiBarcode {
  code: string;
  format: string;
}

export interface ApiCountry {
  code: string;
  name: string;
  currency: string;
  is_active: boolean;
}

export interface ApiRules {
  country_code: string;
  version: number;
  text: string;
  created_at: string;
}

export interface ApiMenuItem {
  id: string;
  pos_item_id: string;
  size_id: string;
  name: string;
  size_name: string;
  category: string;
  currency: string;
  base_price: string;
  dynamic_price: string;
  price_beans: number | null;
}

export interface ApiMenuModifier {
  id: string;
  pos_modifier_id: string;
  name: string;
  base_price: string;
  price_beans: number | null;
}

export interface ApiMenuItemDetail extends ApiMenuItem {
  modifiers: ApiMenuModifier[];
}

export interface ApiLoyaltyBalance {
  balance: number;
}

export type ApiLoyaltyTransactionType = 'accrual' | 'spend' | 'expire';

export interface ApiLoyaltyTransaction {
  id: string;
  type: ApiLoyaltyTransactionType;
  amount: number;
  comment: string | null;
  correlation_id: string | null;
  created_at: string;
}

export interface ApiLoyaltyTransactionsPage {
  items: ApiLoyaltyTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export type ApiCouponStatus = 'active' | 'reserved' | 'used' | 'expired';
export type ApiPurchaseKind = 'bean' | 'money';

export interface ApiCouponSnapshotItem {
  kind: 'drink' | 'modifier';
  pos_id: string;
  name: string;
  size_name?: string;
  price_money: string | null;
  price_beans: number | null;
}

export interface ApiCoupon {
  id: string;
  status: ApiCouponStatus;
  qr_token: string;
  purchase_kind: ApiPurchaseKind;
  price_beans: number | null;
  price_money: string | null;
  currency: string;
  country_code: string;
  expires_at: string;
  reserved_at: string | null;
  used_at: string | null;
  created_at: string;
  snapshot_items: ApiCouponSnapshotItem[];
}

export interface ApiCouponsPage {
  items: ApiCoupon[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiQuoteItem {
  kind: 'drink' | 'modifier';
  pos_id: string;
  name: string;
  size_name?: string;
  price_money: string;
  price_beans: number | null;
}

export interface ApiBeanQuote {
  quote_id: string;
  total_beans: number;
  total_money: string;
  currency: string;
  expires_in: number;
  items: ApiQuoteItem[];
}

export interface ApiMoneyQuote {
  quote_id: string;
  total_money: string;
  currency: string;
  expires_in: number;
  items: ApiQuoteItem[];
}

export interface ApiMoneyPayment {
  payment_id: string;
  status: string;
  confirmation_url: string;
  confirmation_token: string | null;
}

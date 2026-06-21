import { loyaltyFetch } from '@/lib/api/loyalty/client';
import type {
  ApiCountry,
  ApiLoyaltyBalance,
  ApiLoyaltyTransactionsPage,
  ApiLoyaltyTransactionType,
  ApiMenuItem,
  ApiMenuItemDetail,
  ApiRules,
} from '@/lib/api/loyalty/types';

export async function fetchCountries(): Promise<ApiCountry[]> {
  return loyaltyFetch<ApiCountry[]>('countries');
}

export async function fetchRules(country: string): Promise<ApiRules> {
  return loyaltyFetch<ApiRules>(`rules?country=${encodeURIComponent(country)}`);
}

export async function fetchMenu(country: string): Promise<ApiMenuItem[]> {
  return loyaltyFetch<ApiMenuItem[]>(`menu?country=${encodeURIComponent(country)}`);
}

export async function fetchMenuItem(itemId: string): Promise<ApiMenuItemDetail> {
  return loyaltyFetch<ApiMenuItemDetail>(`menu/items/${encodeURIComponent(itemId)}`);
}

export async function fetchLoyaltyBalance(): Promise<ApiLoyaltyBalance> {
  return loyaltyFetch<ApiLoyaltyBalance>('loyalty/balance', { auth: true });
}

export async function fetchLoyaltyTransactions(params?: {
  type?: ApiLoyaltyTransactionType;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiLoyaltyTransactionsPage> {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return loyaltyFetch<ApiLoyaltyTransactionsPage>(
    `loyalty/transactions${qs ? `?${qs}` : ''}`,
    { auth: true },
  );
}

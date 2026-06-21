import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';
import type {
  ApiBeanQuote,
  ApiCoupon,
  ApiCouponsPage,
  ApiCouponStatus,
  ApiMoneyPayment,
  ApiMoneyQuote,
} from '@/lib/api/loyalty/types';

export async function fetchCoupons(params?: {
  status?: ApiCouponStatus;
  limit?: number;
  offset?: number;
}): Promise<ApiCouponsPage> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return loyaltyFetch<ApiCouponsPage>(`coupons${qs ? `?${qs}` : ''}`, { auth: true });
}

export async function fetchCoupon(couponId: string): Promise<ApiCoupon> {
  return loyaltyFetch<ApiCoupon>(`coupons/${encodeURIComponent(couponId)}`, {
    auth: true,
  });
}

export async function quoteBeanPurchase(body: {
  item_id: string;
  modifier_ids?: string[];
}): Promise<ApiBeanQuote> {
  return loyaltyFetch<ApiBeanQuote>('coupons/quote-bean', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function quoteMoneyPurchase(body: {
  item_id: string;
  modifier_ids?: string[];
}): Promise<ApiMoneyQuote> {
  return loyaltyFetch<ApiMoneyQuote>('coupons/quote-money', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function purchaseCouponWithQuote(quoteId: string): Promise<ApiCoupon> {
  return loyaltyFetch<ApiCoupon>('coupons', {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ quote_id: quoteId }),
  });
}

export async function createMoneyPayment(quoteId: string): Promise<ApiMoneyPayment> {
  return loyaltyFetch<ApiMoneyPayment>('coupons/purchase-money', {
    method: 'POST',
    auth: true,
    ...loyaltyJson({ quote_id: quoteId }),
  });
}

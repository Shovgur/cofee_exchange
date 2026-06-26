import { parsePrice } from '@/lib/api/exchange';
import type { ApiCoupon, ApiMenuItem, ApiUserProfile } from '@/lib/api/loyalty/types';
import {
  buildDrinkFromGroup,
  drinkRouteIdFromName,
  inferDrinkCategoryFromApiCategory,
  inferDrinkCategoryFromApiName,
} from '@/lib/drinks/build-from-prices';
import type { ApiPriceItem } from '@/lib/api/exchange';
import type { Coupon, CouponStatus, Country, Drink, User } from '@/types';
import { currencySymbolFor } from '@/lib/geo/countries';

function sizeNameToLabel(sizeName: string): string {
  const n = parseFloat(sizeName.replace(',', '.'));
  if (Number.isFinite(n) && n <= 2) return `${Math.round(n * 1000)}`;
  return sizeName;
}

function sizeNameToValue(sizeName: string): string {
  const n = parseFloat(sizeName.replace(',', '.'));
  if (Number.isFinite(n)) return String(n);
  return sizeName;
}

/** Преобразование позиций меню лояльности в формат цен для buildDrinkFromGroup */
export function loyaltyMenuToPriceItems(items: ApiMenuItem[]): ApiPriceItem[] {
  return items.map((item) => {
    const base = parsePrice(item.base_price);
    const current = parsePrice(item.dynamic_price);
    const pct = base > 0 ? ((current - base) / base) * 100 : 0;
    const liters = parseFloat(item.size_name.replace(',', '.'));
    return {
      drink_id: item.id,
      pos_item_id: item.pos_item_id,
      name: item.name,
      unitCapacity: Number.isFinite(liters) ? liters : undefined,
      volume: item.size_name,
      base_price: item.base_price,
      current_price: item.dynamic_price,
      current_pct: pct.toFixed(2),
      min_pct: '-50',
      max_pct: '50',
      is_fixed: false,
      last_bucket: '',
      updated_at: new Date().toISOString(),
    };
  });
}

export function buildDrinksFromLoyaltyMenu(
  items: ApiMenuItem[],
  countryId: string,
): Drink[] {
  const priceItems = loyaltyMenuToPriceItems(items);
  const groups = new Map<string, ApiPriceItem[]>();
  for (const entry of priceItems) {
    const list = groups.get(entry.name) ?? [];
    list.push(entry);
    groups.set(entry.name, list);
  }

  const drinks = Array.from(groups.values())
    .map((entries) => buildDrinkFromGroup(entries, countryId))
    .filter((d): d is Drink => d !== null);

  const itemById = new Map(items.map((i) => [i.id, i]));
  const categoryByName = new Map<string, Drink['category']>();
  for (const item of items) {
    if (!item.category || categoryByName.has(item.name)) continue;
    categoryByName.set(item.name, inferDrinkCategoryFromApiCategory(item.category));
  }

  for (const drink of drinks) {
    const apiCategory = categoryByName.get(drink.name);
    if (apiCategory) drink.category = apiCategory;

    for (const vol of drink.volumes) {
      const src = itemById.get(vol.apiDrinkId ?? '');
      if (src) {
        vol.loyaltyItemId = src.id;
        vol.priceBeans = src.price_beans;
      }
    }
  }

  return drinks.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function mapProfileToUser(
  profile: ApiUserProfile,
  balance: number,
  fallbackCountryId: string,
): User {
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  const name = parts.length > 0 ? parts.join(' ') : profile.phone;

  return {
    id: profile.id,
    name,
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    middleName: profile.middle_name ?? undefined,
    phone: profile.phone,
    loyaltyLevel: 'Member',
    loyaltyPoints: balance,
    countryId: profile.country_code || fallbackCountryId,
    userCode: profile.code,
    profileCompleted: profile.profile_completed,
    email: profile.email ?? undefined,
    birthDate: profile.birth_date ?? undefined,
  };
}

function mapCouponStatus(status: ApiCoupon['status']): CouponStatus {
  if (status === 'reserved') return 'reserved';
  if (status === 'expired') return 'expired';
  if (status === 'used') return 'used';
  return 'active';
}

function inferCategoryFromCoupon(coupon: ApiCoupon): Drink['category'] {
  const drink = coupon.snapshot_items.find((i) => i.kind === 'drink');
  if (!drink) return 'coffee';
  return inferDrinkCategoryFromApiName(drink.name);
}

function buildPurchaseSummary(coupon: ApiCoupon): string {
  return coupon.snapshot_items
    .map((item) => {
      if (item.kind === 'drink') {
        const size = item.size_name ? ` · ${sizeNameToLabel(item.size_name)} мл` : '';
        return `${item.name}${size}`;
      }
      return item.name;
    })
    .join('\n');
}

export function mapApiCouponToUi(coupon: ApiCoupon, country?: Country): Coupon {
  const drink = coupon.snapshot_items.find((i) => i.kind === 'drink');
  const countryId = coupon.country_code;

  const priceMoney =
    parsePrice(coupon.price_money) ||
    parsePrice(drink?.price_money ?? null) ||
    0;

  const sizeLabel = drink?.size_name
    ? `${sizeNameToLabel(drink.size_name)} мл`
    : undefined;

  return {
    id: coupon.id,
    drinkId: drink ? drinkRouteIdFromName(drink.name) : coupon.id,
    drinkName: drink?.name ?? 'Напиток',
    category: inferCategoryFromCoupon(coupon),
    purchasePrice: priceMoney,
    currency: coupon.currency,
    currencySymbol: country?.currencySymbol ?? currencySymbolFor(coupon.currency),
    purchasedAt: coupon.created_at,
    expiresAt: coupon.expires_at,
    status: mapCouponStatus(coupon.status),
    qrData: coupon.qr_token,
    countryId,
    volumeLabel: sizeLabel,
    purchaseSummary: buildPurchaseSummary(coupon),
    paymentMethod: coupon.purchase_kind === 'bean' ? 'beans' : 'card',
    priceBeans: coupon.price_beans ?? drink?.price_beans ?? undefined,
    reservedAt: coupon.reserved_at,
    usedAt: coupon.used_at,
  };
}

export function findLoyaltyItemId(
  menuItems: ApiMenuItem[],
  drinkRouteParam: string,
  volumeValue: string,
): string | undefined {
  const candidates = menuItems.filter((item) => {
    if (item.id === drinkRouteParam) return true;
    return drinkRouteIdFromName(item.name) === drinkRouteParam;
  });

  const volMatch = candidates.find(
    (item) =>
      item.size_id === volumeValue ||
      sizeNameToValue(item.size_name) === volumeValue ||
      sizeNameToLabel(item.size_name) === volumeValue,
  );
  return volMatch?.id ?? candidates[0]?.id;
}

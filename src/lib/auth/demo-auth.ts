import type { Country, Coupon, Drink, DrinkCategory, User, VolumePrice } from '@/types';

const DEMO_SESSION_KEY = 'ce_demo_session';

export interface DemoSessionData {
  user: User;
  coupons: Coupon[];
}

export function isDemoAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_AUTH === 'true';
}

export function loadDemoSession(): DemoSessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSessionData;
  } catch {
    return null;
  }
}

export function saveDemoSession(data: DemoSessionData): void {
  try {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function clearDemoSession(): void {
  try {
    localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isDemoSessionActive(): boolean {
  return loadDemoSession() != null;
}

export function buildDemoUser(countryId: string): User {
  return {
    id: 'demo-user',
    name: 'Демо-пользователь',
    phone: '+7 900 000-00-00',
    loyaltyLevel: 'Gold',
    loyaltyPoints: 5000,
    countryId,
    userCode: '12345678',
    profileCompleted: true,
  };
}

export function createDemoCoupon(params: {
  drink: Drink;
  activeVol: VolumePrice;
  country: Country;
  totalRub: number;
  totalBeans: number;
  paymentMethod: 'card' | 'beans';
  addonLabels: string[];
}): Coupon {
  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const summaryParts = [
    params.drink.name,
    `${params.activeVol.label} мл`,
    ...params.addonLabels,
  ].filter(Boolean);

  return {
    id,
    drinkId: params.drink.id,
    drinkName: params.drink.name,
    category: params.drink.category as DrinkCategory,
    purchasePrice: params.totalRub,
    currency: params.country.currency,
    currencySymbol: params.country.currencySymbol,
    purchasedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: 'active',
    qrData: `DEMO${id.replace(/\D/g, '').slice(-12).padStart(12, '0')}`,
    countryId: params.country.id,
    volumeLabel: `${params.activeVol.label} мл`,
    purchaseSummary: summaryParts.join('\n'),
    paymentMethod: params.paymentMethod,
    priceBeans: params.paymentMethod === 'beans' ? params.totalBeans : undefined,
  };
}

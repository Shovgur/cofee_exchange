import type { Coupon, DrinkCategory } from '@/types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const MOCK_COUPONS: Coupon[] = [
  {
    id: 'cpn-001',
    drinkId: 'cappuccino',
    drinkName: 'Капучино',
    category: 'coffee' as DrinkCategory,
    purchasePrice: 219,
    currency: 'RUB',
    currencySymbol: '₽',
    purchasedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(now + 5 * day).toISOString(),
    status: 'active',
    qrData: 'CE:cpn-001:cappuccino:219:RU',
    countryId: 'RU',
  },
  {
    id: 'cpn-002',
    drinkId: 'latte',
    drinkName: 'Латте',
    category: 'coffee' as DrinkCategory,
    purchasePrice: 239,
    currency: 'RUB',
    currencySymbol: '₽',
    purchasedAt: new Date(now - 1 * day).toISOString(),
    expiresAt: new Date(now + 4 * day).toISOString(),
    status: 'active',
    qrData: 'CE:cpn-002:latte:239:RU',
    countryId: 'RU',
  },
  {
    id: 'cpn-003',
    drinkId: 'americano',
    drinkName: 'Американо',
    category: 'coffee' as DrinkCategory,
    purchasePrice: 175,
    currency: 'RUB',
    currencySymbol: '₽',
    purchasedAt: new Date(now - 3 * day).toISOString(),
    expiresAt: new Date(now - 1 * day).toISOString(),
    status: 'used',
    qrData: 'CE:cpn-003:americano:175:RU',
    countryId: 'RU',
  },
  {
    id: 'cpn-004',
    drinkId: 'lemonade-classic',
    drinkName: 'Лимонад классический',
    category: 'lemonade' as DrinkCategory,
    purchasePrice: 199,
    currency: 'RUB',
    currencySymbol: '₽',
    purchasedAt: new Date(now - 10 * day).toISOString(),
    expiresAt: new Date(now - 5 * day).toISOString(),
    status: 'expired',
    qrData: 'CE:cpn-004:lemonade-classic:199:RU',
    countryId: 'RU',
  },
];

export function generateCouponId(): string {
  return `cpn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

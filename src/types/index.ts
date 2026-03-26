// Country
export interface Country {
  id: string;
  name: string;
  nameEn: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  locale: string;
}

// Price
export interface PricePoint {
  timestamp: number;
  price: number;
}

// Menu / Drinks
export type DrinkCategory = 'coffee' | 'lemonade' | 'tea';

export type PriceTrend = 'up' | 'down' | 'neutral';

export interface Drink {
  id: string;
  name: string;
  nameShort: string;
  category: DrinkCategory;
  volume: string;
  currentPrice: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  priceChange: number; // percent
  trend: PriceTrend;
  description: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  priceHistory: PricePoint[];
  countryId: string;
  available: boolean;
}

// Feed
export type FeedItemType = 'news' | 'promotion' | 'event' | 'new_drink';

export type FeedLink =
  | { type: 'menu' }
  | { type: 'map' }
  | { type: 'drink'; drinkId: string };

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  imageUrl?: string;
  publishedAt: string;
  countryId: string;
  link?: FeedLink;
}

// Coffee Shop / Map
export interface WorkHours {
  days: string;
  open: string;
  close: string;
}

export interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  workHours: WorkHours[];
  countryId: string;
  rating: number;
  photoUrl?: string;
}

// Coupons
export type CouponStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface Coupon {
  id: string;
  drinkId: string;
  drinkName: string;
  category: DrinkCategory;
  purchasePrice: number;
  currency: string;
  currencySymbol: string;
  purchasedAt: string;
  expiresAt: string;
  status: CouponStatus;
  qrData: string;
  countryId: string;
}

// User
export interface User {
  id: string;
  name: string;
  phone: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  countryId: string;
}

// Purchase notification
export interface PurchaseIntent {
  drinkId: string;
  quantity: number;
}

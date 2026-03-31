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

// Volume price (0.2 / 0.4 / 0.6 л)
export interface VolumePrice {
  value: string;          // '0.2' | '0.4' | '0.6'
  label: string;          // '0.2 л'
  price: number;
  change: number;         // percent
  trend: PriceTrend;
  priceHistory: PricePoint[];
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
  photoUrl?: string;
  volumes: VolumePrice[];
}

// IPO напитков
export type IpoStatus = 'upcoming' | 'active' | 'released';

export interface IpoDrink {
  id: string;
  name: string;
  nameShort: string;
  category: DrinkCategory;
  description: string;
  fullDescription: string;
  photoUrl?: string;
  preorderPrice: number;
  countryId: string;
  status: IpoStatus;
  saleStartsAt: string;   // ISO date
  releaseDate?: string;   // ISO date when fully released into menu
  volumes: { label: string; value: string; preorderPrice: number }[];
}

// Feed
export type FeedItemType = 'news' | 'promotion' | 'event' | 'new_drink' | 'ipo';

export type FeedLink =
  | { type: 'menu' }
  | { type: 'map' }
  | { type: 'drink'; drinkId: string }
  | { type: 'ipo'; ipoId: string };

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
  isPreorder?: boolean;
  saleStartsAt?: string;
  volumeLabel?: string;
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

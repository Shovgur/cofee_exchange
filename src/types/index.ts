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
  value: string;       
  label: string;         
  price: number;
  /** Базовая цена с бэка для этого объёма (если есть). */
  basePrice?: number;
  apiDrinkId?: string;
  /** ID позиции в API лояльности (для котировки/покупки) */
  loyaltyItemId?: string;
  /** Стоимость в Бинах с бэкенда */
  priceBeans?: number | null;
  change: number;        
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
  saleStartsAt: string;   
  releaseDate?: string;  
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
export type CouponStatus = 'active' | 'used' | 'expired' | 'cancelled' | 'reserved';

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
  /** Числовой номер купона (штрихкод) */
  number: string | null;
  /** Значение для отображения штрихкода: number или fallback qr_token */
  barcodeCode: string;
  countryId: string;
  isPreorder?: boolean;
  saleStartsAt?: string;
  volumeLabel?: string;
  /** Полное текстовое описание состава заказа (напиток, объём, добавки). */
  purchaseSummary?: string;
  /** Способ оплаты */
  paymentMethod?: 'card' | 'beans';
  /** Стоимость в Бинах (если покупка за Бины) */
  priceBeans?: number | null;
  reservedAt?: string | null;
  usedAt?: string | null;
}

// User
export interface User {
  id: string;
  /** Собранное полное имя для отображения (first + last или phone) */
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone: string;
  loyaltyLevel: string;
  loyaltyPoints: number;
  countryId: string;
  /** 8-значный код для штрихкода (API лояльности) */
  userCode?: string;
  profileCompleted?: boolean;
  email?: string;
  birthDate?: string;
}

// Purchase notification
export interface PurchaseIntent {
  drinkId: string;
  quantity: number;
}

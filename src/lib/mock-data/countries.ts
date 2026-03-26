import type { Country } from '@/types';

export const COUNTRIES: Country[] = [
  {
    id: 'RU',
    name: 'Россия',
    nameEn: 'Russia',
    currency: 'RUB',
    currencySymbol: '₽',
    flag: '🇷🇺',
    locale: 'ru-RU',
  },
  {
    id: 'KZ',
    name: 'Казахстан',
    nameEn: 'Kazakhstan',
    currency: 'KZT',
    currencySymbol: '₸',
    flag: '🇰🇿',
    locale: 'kk-KZ',
  },
];

export const DEFAULT_COUNTRY_ID = 'RU';

export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function detectCountry(): string {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY_ID;
  const lang = navigator.language?.toUpperCase();
  if (lang?.startsWith('KK') || lang?.startsWith('KZ')) return 'KZ';
  return 'RU';
}

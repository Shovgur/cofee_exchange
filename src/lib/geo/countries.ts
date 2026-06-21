import type { Country } from '@/types';
import type { ApiCountry } from '@/lib/api/loyalty/types';

const FLAG_BY_CODE: Record<string, string> = {
  RU: '🇷🇺',
  KZ: '🇰🇿',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  KZT: '₸',
};

const LOCALE_BY_CODE: Record<string, string> = {
  RU: 'ru-RU',
  KZ: 'kk-KZ',
};

export function mapApiCountry(c: ApiCountry): Country {
  return {
    id: c.code,
    name: c.name,
    nameEn: c.name,
    currency: c.currency,
    currencySymbol: CURRENCY_SYMBOLS[c.currency] ?? c.currency,
    flag: FLAG_BY_CODE[c.code] ?? '🏳️',
    locale: LOCALE_BY_CODE[c.code] ?? 'ru-RU',
  };
}

export function detectCountryCode(): string {
  if (typeof window === 'undefined') return 'RU';
  const lang = navigator.language?.toUpperCase();
  if (lang?.startsWith('KK') || lang?.startsWith('KZ')) return 'KZ';
  return 'RU';
}

export function currencySymbolFor(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

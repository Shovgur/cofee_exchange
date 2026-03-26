/** Dial codes for phone input (demo / MVP — extend as needed). */

export interface DialOption {
  code: string;
  flag: string;
  label: string;
  /** Typical national number length (digits), for placeholder / loose validation */
  placeholder: string;
}

export const DIAL_OPTIONS: DialOption[] = [
  { code: '+7', flag: '🇷🇺', label: 'Россия / Казахстан', placeholder: '999 123-45-67' },
  { code: '+1', flag: '🇺🇸', label: 'США / Канада', placeholder: '202 555 0123' },
  { code: '+44', flag: '🇬🇧', label: 'Великобритания', placeholder: '7700 900123' },
  { code: '+49', flag: '🇩🇪', label: 'Германия', placeholder: '151 23456789' },
  { code: '+33', flag: '🇫🇷', label: 'Франция', placeholder: '6 12 34 56 78' },
  { code: '+39', flag: '🇮🇹', label: 'Италия', placeholder: '312 345 6789' },
  { code: '+34', flag: '🇪🇸', label: 'Испания', placeholder: '612 34 56 78' },
  { code: '+48', flag: '🇵🇱', label: 'Польша', placeholder: '512 345 678' },
  { code: '+380', flag: '🇺🇦', label: 'Украина', placeholder: '50 123 4567' },
  { code: '+375', flag: '🇧🇾', label: 'Беларусь', placeholder: '29 123-45-67' },
  { code: '+994', flag: '🇦🇿', label: 'Азербайджан', placeholder: '50 123 45 67' },
  { code: '+374', flag: '🇦🇲', label: 'Армения', placeholder: '77 123456' },
  { code: '+995', flag: '🇬🇪', label: 'Грузия', placeholder: '555 12 34 56' },
  { code: '+996', flag: '🇰🇬', label: 'Кыргызстан', placeholder: '700 123456' },
  { code: '+998', flag: '🇺🇿', label: 'Узбекистан', placeholder: '90 123 45 67' },
  { code: '+86', flag: '🇨🇳', label: 'Китай', placeholder: '131 2345 6789' },
  { code: '+81', flag: '🇯🇵', label: 'Япония', placeholder: '90 1234 5678' },
  { code: '+82', flag: '🇰🇷', label: 'Корея', placeholder: '10 1234 5678' },
  { code: '+971', flag: '🇦🇪', label: 'ОАЭ', placeholder: '50 123 4567' },
  { code: '+90', flag: '🇹🇷', label: 'Турция', placeholder: '532 123 45 67' },
  { code: '+66', flag: '🇹🇭', label: 'Таиланд', placeholder: '81 234 5678' },
];

export function getDialByCode(code: string): DialOption | undefined {
  return DIAL_OPTIONS.find((d) => d.code === code);
}

/** Minimum national digits (without country code) for a “valid enough” demo */
const MIN_NATIONAL = 8;
const MAX_NATIONAL = 15;

export function isValidNationalDigits(digits: string): boolean {
  return digits.length >= MIN_NATIONAL && digits.length <= MAX_NATIONAL;
}

export function formatNationalLoose(value: string, maxLen = MAX_NATIONAL): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Country } from '@/types';
import { fetchCountries } from '@/lib/api/loyalty';
import { detectCountryCode, mapApiCountry } from '@/lib/geo/countries';

const STORAGE_KEY = 'ce_country';

interface CountryContextValue {
  country: Country;
  setCountry: (id: string) => void;
  countries: Country[];
  isDetecting: boolean;
}

const CountryContext = createContext<CountryContextValue | null>(null);

const FALLBACK_COUNTRY: Country = {
  id: 'RU',
  name: 'Россия',
  nameEn: 'Russia',
  currency: 'RUB',
  currencySymbol: '₽',
  flag: '🇷🇺',
  locale: 'ru-RU',
};

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([FALLBACK_COUNTRY]);
  const [country, setCountryState] = useState<Country>(FALLBACK_COUNTRY);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const apiCountries = await fetchCountries();
        const mapped = apiCountries
          .filter((c) => c.is_active)
          .map(mapApiCountry);
        if (mapped.length > 0) setCountries(mapped);

        const list = mapped.length > 0 ? mapped : [FALLBACK_COUNTRY];
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const found = list.find((c) => c.id === stored);
          if (found) {
            setCountryState(found);
            setIsDetecting(false);
            return;
          }
        }
        const detected = detectCountryCode();
        const found = list.find((c) => c.id === detected) ?? list[0];
        setCountryState(found);
      } catch {
        /* keep fallback */
      }
      setIsDetecting(false);
    }
    void init();
  }, []);

  const setCountry = useCallback(
    (id: string) => {
      const found = countries.find((c) => c.id === id);
      if (!found) return;
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
      setCountryState(found);
    },
    [countries],
  );

  return (
    <CountryContext.Provider
      value={{ country, setCountry, countries, isDetecting }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used inside CountryProvider');
  return ctx;
}

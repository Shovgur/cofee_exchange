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
import { COUNTRIES, getCountryById, detectCountry } from '@/lib/mock-data';

const STORAGE_KEY = 'ce_country';

interface CountryContextValue {
  country: Country;
  setCountry: (id: string) => void;
  countries: Country[];
  isDetecting: boolean;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(
    getCountryById('RU') as Country,
  );
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const found = getCountryById(stored);
        if (found) {
          setCountryState(found);
          setIsDetecting(false);
          return;
        }
      }
      const detected = detectCountry();
      const found = getCountryById(detected) ?? (getCountryById('RU') as Country);
      setCountryState(found);
    } catch {}
    setIsDetecting(false);
  }, []);

  const setCountry = useCallback((id: string) => {
    const found = getCountryById(id);
    if (!found) return;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setCountryState(found);
  }, []);

  return (
    <CountryContext.Provider
      value={{ country, setCountry, countries: COUNTRIES, isDetecting }}
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

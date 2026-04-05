'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { fetchAllPrices, type ApiPriceItem } from '@/lib/api';
import { buildDrinkFromGroup } from '@/lib/api/menu';
import { useCountry } from '@/contexts/CountryContext';
import type { Drink, PriceTrend } from '@/types';

// Бэкенд пересчитывает цены каждые 15 секунд на основе продаж за последние 5 минут
const POLL_INTERVAL_MS = 15_000;

// ─── Context shape ────────────────────────────────────────────────────────────

interface PricesContextValue {
  drinks: Drink[];
  prices: ApiPriceItem[];
  loading: boolean;
  error: string | null;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
}

const PricesContext = createContext<PricesContextValue | null>(null);

export function usePrices(): PricesContextValue {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error('usePrices must be used inside PricesProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function PricesProvider({ children }: { children: ReactNode }) {
  const { country } = useCountry();

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [prices, setPrices] = useState<ApiPriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Map<string, PriceTrend>>(new Map());
  const [flashGen, setFlashGen] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(
    (silent = false) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (!silent) setLoading(true);
      setError(null);

      fetchAllPrices()
        .then((data) => {
          if (ctrl.signal.aborted) return;

          const groups = new Map<string, ApiPriceItem[]>();
          for (const item of data.prices) {
            const existing = groups.get(item.name) ?? [];
            existing.push(item);
            groups.set(item.name, existing);
          }

          const built: Drink[] = Array.from(groups.values())
            .map((entries) => buildDrinkFromGroup(entries, country.id))
            .filter((d): d is Drink => d !== null)
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

          // Flash только на авто-обновлении по таймеру
          setDrinks((prev) => {
            if (prev.length > 0 && silent) {
              const map = new Map<string, PriceTrend>();
              for (const nd of built) {
                const od = prev.find((d) => d.id === nd.id);
                if (!od) continue;
                // Проверяем любой объём — не только средний (currentPrice)
                const anyVolumeChanged =
                  od.currentPrice !== nd.currentPrice ||
                  nd.volumes.some((nv, i) => od.volumes[i]?.price !== nv.price);
                if (anyVolumeChanged) {
                  map.set(nd.id, nd.trend);
                }
              }
              if (map.size > 0) {
                if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
                setFlashMap(map);
                setFlashGen((g) => g + 1);
                flashTimerRef.current = setTimeout(() => setFlashMap(new Map()), 1200);
              }
            }
            return built;
          });

          setPrices(data.prices);
          setLoading(false);
        })
        .catch((err) => {
          if (ctrl.signal.aborted) return;
          setError(err instanceof Error ? err.message : 'Ошибка загрузки цен');
          setLoading(false);
        });
    },
    [country.id],
  );

  // Первичная загрузка при старте / смене страны
  useEffect(() => {
    doFetch(false);
    return () => {
      abortRef.current?.abort();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [doFetch]);

  // Опрос каждые 15 секунд — бэкенд обновляет цены с таким интервалом
  useEffect(() => {
    const id = setInterval(() => doFetch(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [doFetch]);

  return (
    <PricesContext.Provider
      value={{
        drinks,
        prices,
        loading,
        error,
        flashMap,
        flashGen,
      }}
    >
      {children}
    </PricesContext.Provider>
  );
}

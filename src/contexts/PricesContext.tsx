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
import { getNextPriceUpdateAt } from '@/lib/utils';
import { useCountry } from '@/contexts/CountryContext';
import type { Drink, PriceTrend } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_INTERVAL_MINUTES = 5;

/** Секунд до следующей 5-минутной метки по системным часам (3:45, 3:50, 3:55…) */
function secondsToNextBoundary(): number {
  return Math.max(1, Math.ceil((getNextPriceUpdateAt(PRICE_INTERVAL_MINUTES) - Date.now()) / 1000));
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface PricesContextValue {
  drinks: Drink[];
  prices: ApiPriceItem[];
  loading: boolean;
  error: string | null;
  secondsLeft: number;
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
  // Инициализируется сразу корректным значением — при любом старте приложения
  const [secondsLeft, setSecondsLeft] = useState(secondsToNextBoundary);
  const [flashMap, setFlashMap] = useState<Map<string, PriceTrend>>(new Map());
  const [flashGen, setFlashGen] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Следующая глобальная метка обновления (кратная 5 мин по системным часам)
  const nextBoundaryRef = useRef<number>(getNextPriceUpdateAt(PRICE_INTERVAL_MINUTES));

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
                if (od && od.currentPrice !== nd.currentPrice) {
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
          // После фетча сразу вычисляем следующую границу
          nextBoundaryRef.current = getNextPriceUpdateAt(PRICE_INTERVAL_MINUTES);
          setSecondsLeft(secondsToNextBoundary());
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

  // Таймер по настенным часам: тикает каждую секунду, срабатывает на кратных 5 мин метках.
  // Все пользователи видят одинаковый отсчёт вне зависимости от того когда зашли.
  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = Math.ceil((nextBoundaryRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        nextBoundaryRef.current = getNextPriceUpdateAt(PRICE_INTERVAL_MINUTES);
        setSecondsLeft(secondsToNextBoundary());
        doFetch(true);
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [doFetch]);

  return (
    <PricesContext.Provider
      value={{
        drinks,
        prices,
        loading,
        error,
        secondsLeft,
        flashMap,
        flashGen,
      }}
    >
      {children}
    </PricesContext.Provider>
  );
}

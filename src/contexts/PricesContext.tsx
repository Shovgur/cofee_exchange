"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildDrinksFromLoyaltyMenu,
  fetchMenu,
  loyaltyMenuToPriceItems,
  type ApiMenuItem,
} from "@/lib/api/loyalty";
import { useCountry } from "@/contexts/CountryContext";
import type { Drink, PriceTrend } from "@/types";

export const PRICES_POLL_INTERVAL_MS = 30_000;

function msUntilNextPollBoundary(periodMs: number, minMs = 400): number {
  const now = Date.now();
  const remainder = now % periodMs;
  const until = remainder === 0 ? periodMs : periodMs - remainder;
  return Math.max(until, minMs);
}

interface PricesContextValue {
  drinks: Drink[];
  prices: ReturnType<typeof loyaltyMenuToPriceItems>;
  menuItems: ApiMenuItem[];
  loading: boolean;
  error: string | null;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
  secondsUntilNextPoll: number | null;
}

const PricesContext = createContext<PricesContextValue | null>(null);

export function usePrices(): PricesContextValue {
  const ctx = useContext(PricesContext);
  if (!ctx) throw new Error("usePrices must be used inside PricesProvider");
  return ctx;
}

export function PricesProvider({ children }: { children: ReactNode }) {
  const { country } = useCountry();

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [prices, setPrices] = useState<ReturnType<typeof loyaltyMenuToPriceItems>>([]);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Map<string, PriceTrend>>(new Map());
  const [flashGen, setFlashGen] = useState(0);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<number | null>(null);

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulPollAtRef = useRef<number | null>(null);
  const nextScheduledPollAtRef = useRef<number | null>(null);
  const pollGenerationRef = useRef(0);
  const doFetchRef = useRef<(silent?: boolean) => void>(() => {});
  const mountedRef = useRef(false);

  const scheduleNextAutoPoll = useCallback(() => {
    if (pollTimeoutRef.current != null) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    const delay = msUntilNextPollBoundary(PRICES_POLL_INTERVAL_MS);
    const at = Date.now() + delay;
    nextScheduledPollAtRef.current = at;
    setSecondsUntilNextPoll(Math.max(0, Math.ceil((at - Date.now()) / 1000)));

    pollTimeoutRef.current = setTimeout(() => {
      pollTimeoutRef.current = null;
      if (!mountedRef.current) return;
      doFetchRef.current(true);
    }, delay);
  }, []);

  const applyDrinksWithFlash = useCallback((built: Drink[], silent: boolean) => {
    setDrinks((prev) => {
      if (prev.length > 0 && silent) {
        const map = new Map<string, PriceTrend>();
        for (const nd of built) {
          const od = prev.find((d) => d.id === nd.id);
          if (!od) continue;
          const anyVolumeChanged =
            od.currentPrice !== nd.currentPrice ||
            nd.volumes.some((nv, i) => od.volumes[i]?.price !== nv.price);
          if (anyVolumeChanged) map.set(nd.id, nd.trend);
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
  }, []);

  const doFetch = useCallback(
    (silent = false) => {
      const gen = ++pollGenerationRef.current;

      if (!silent) {
        if (pollTimeoutRef.current != null) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        nextScheduledPollAtRef.current = null;
        setLoading(true);
        lastSuccessfulPollAtRef.current = null;
        setSecondsUntilNextPoll(null);
      }
      setError(null);

      fetchMenu(country.id)
        .then((items) => {
          if (!mountedRef.current || gen !== pollGenerationRef.current) return;
          const built = buildDrinksFromLoyaltyMenu(items, country.id);
          applyDrinksWithFlash(built, silent);
          setPrices(loyaltyMenuToPriceItems(items));
          setMenuItems(items);
          setLoading(false);
          lastSuccessfulPollAtRef.current = Date.now();
        })
        .catch((err) => {
          if (!mountedRef.current || gen !== pollGenerationRef.current) return;
          setError(err instanceof Error ? err.message : "Ошибка загрузки меню");
          setLoading(false);
        })
        .finally(() => {
          if (!mountedRef.current) return;
          scheduleNextAutoPoll();
        });
    },
    [applyDrinksWithFlash, country.id, scheduleNextAutoPoll],
  );

  doFetchRef.current = doFetch;

  useEffect(() => {
    mountedRef.current = true;
    doFetch(false);
    return () => {
      mountedRef.current = false;
      pollGenerationRef.current += 1;
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (pollTimeoutRef.current != null) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [doFetch]);

  useEffect(() => {
    const id = setInterval(() => {
      const target = nextScheduledPollAtRef.current;
      if (target != null) {
        setSecondsUntilNextPoll(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
        return;
      }
      const base = lastSuccessfulPollAtRef.current;
      if (base === null) return;
      setSecondsUntilNextPoll(
        Math.max(0, Math.ceil((base + PRICES_POLL_INTERVAL_MS - Date.now()) / 1000)),
      );
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <PricesContext.Provider
      value={{
        drinks,
        prices,
        menuItems,
        loading,
        error,
        flashMap,
        flashGen,
        secondsUntilNextPoll,
      }}
    >
      {children}
    </PricesContext.Provider>
  );
}

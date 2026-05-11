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
import { fetchAllPrices, type ApiPriceItem } from "@/lib/api";
import { buildDrinkFromGroup } from "@/lib/api/menu";
import { useCountry } from "@/contexts/CountryContext";
import type { Drink, PriceTrend } from "@/types";

export const PRICES_POLL_INTERVAL_MS = 30_000;

function msUntilNextPollBoundary(periodMs: number, minMs = 400): number {
  const now = Date.now();
  const remainder = now % periodMs;
  const until = remainder === 0 ? periodMs : periodMs - remainder;
  return Math.max(until, minMs);
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface PricesContextValue {
  drinks: Drink[];
  prices: ApiPriceItem[];
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

// ─── Provider ────────────────────────────────────────────────────────────────

export function PricesProvider({ children }: { children: ReactNode }) {
  const { country } = useCountry();

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [prices, setPrices] = useState<ApiPriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashMap, setFlashMap] = useState<Map<string, PriceTrend>>(new Map());
  const [flashGen, setFlashGen] = useState(0);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<
    number | null
  >(null);

  const abortRef = useRef<AbortController | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSuccessfulPollAtRef = useRef<number | null>(null);
  const nextScheduledPollAtRef = useRef<number | null>(null);
  const pollGenerationRef = useRef(0);
  /** актуальный doFetch для таймера; обновляется в рендере, без ожидания useEffect */
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

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      fetchAllPrices(ctrl.signal)
        .then((data) => {
          if (!mountedRef.current) return;
          if (gen !== pollGenerationRef.current) return;

          const groups = new Map<string, ApiPriceItem[]>();
          for (const item of data.prices) {
            const existing = groups.get(item.name) ?? [];
            existing.push(item);
            groups.set(item.name, existing);
          }

          const built: Drink[] = Array.from(groups.values())
            .map((entries) => buildDrinkFromGroup(entries, country.id))
            .filter((d): d is Drink => d !== null)
            .sort((a, b) => a.name.localeCompare(b.name, "ru"));

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
                flashTimerRef.current = setTimeout(
                  () => setFlashMap(new Map()),
                  1200,
                );
              }
            }
            return built;
          });

          setPrices(data.prices);
          setLoading(false);

          lastSuccessfulPollAtRef.current = Date.now();
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          if (gen !== pollGenerationRef.current) return;
          if (ctrl.signal.aborted) return;
          setError(err instanceof Error ? err.message : "Ошибка загрузки цен");
          setLoading(false);
        })
        .finally(() => {
          // Не проверяем ctrl.signal.aborted: отменённый запрос без перезапуска
          // обрывал цепочку опроса. Живым остаётся только последний fetch.
          if (!mountedRef.current) return;
          scheduleNextAutoPoll();
        });
    },
    [country.id, scheduleNextAutoPoll],
  );

  doFetchRef.current = doFetch;

  useEffect(() => {
    mountedRef.current = true;
    doFetch(false);
    return () => {
      mountedRef.current = false;
      pollGenerationRef.current += 1;
      abortRef.current?.abort();
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
        const sec = Math.max(0, Math.ceil((target - Date.now()) / 1000));
        setSecondsUntilNextPoll(sec);
        return;
      }
      const base = lastSuccessfulPollAtRef.current;
      if (base === null) return;
      const sec = Math.max(
        0,
        Math.ceil((base + PRICES_POLL_INTERVAL_MS - Date.now()) / 1000),
      );
      setSecondsUntilNextPoll(sec);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <PricesContext.Provider
      value={{
        drinks,
        prices,
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

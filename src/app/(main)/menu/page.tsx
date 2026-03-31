'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Lock, Timer } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDrinksByCountry } from '@/lib/mock-data';
import {
  cn,
  formatPriceChange,
  getNextPriceUpdateAt,
  formatCountdown,
} from '@/lib/utils';
import type { Drink, DrinkCategory, PriceTrend, VolumePrice } from '@/types';

// ─── price simulation ────────────────────────────────────────────────────────

function applyPriceUpdate(drinks: Drink[]): Drink[] {
  return drinks.map((drink) => {
    const newVolumes: VolumePrice[] = drink.volumes.map((vol) => {
      const delta = (Math.random() - 0.47) * 0.05;
      const min = Math.round(drink.basePrice * 0.65);
      const max = Math.round(drink.basePrice * 1.45);
      const newPrice = Math.max(min, Math.min(max, Math.round(vol.price * (1 + delta))));
      const newChange = Math.round(((newPrice / drink.basePrice) - 1) * 1000) / 10;
      const newTrend: PriceTrend =
        newChange > 0.5 ? 'up' : newChange < -0.5 ? 'down' : 'neutral';
      return { ...vol, price: newPrice, change: newChange, trend: newTrend };
    });
    const mid = newVolumes[1];
    return { ...drink, volumes: newVolumes, currentPrice: mid.price, priceChange: mid.change, trend: mid.trend };
  });
}

// ─── hook: live prices + countdown ──────────────────────────────────────────

function useLivePrices(countryId: string, intervalMinutes = 5) {
  const [nextAt, setNextAt] = useState<number>(() => getNextPriceUpdateAt(intervalMinutes));
  const [remaining, setRemaining] = useState(0);
  const [drinks, setDrinks] = useState<Drink[]>(() => getDrinksByCountry(countryId));
  // flashMap: drinkId → trend of its middle volume (for flash colour)
  const [flashMap, setFlashMap] = useState<Map<string, PriceTrend>>(new Map());
  const [flashGen, setFlashGen] = useState(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-seed drinks when country changes
  useEffect(() => {
    setDrinks(getDrinksByCountry(countryId));
  }, [countryId]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = nextAt - now;
      if (diff <= 0) {
        const next = getNextPriceUpdateAt(intervalMinutes);
        setNextAt(next);
        setRemaining(next - Date.now());

        // Update prices
        setDrinks((prev) => {
          const updated = applyPriceUpdate(prev);

          // Schedule flash (use updated inside the setter to avoid stale closure)
          const map = new Map<string, PriceTrend>();
          updated.forEach((d) => map.set(d.id, d.volumes[1].trend));
          setFlashMap(map);
          setFlashGen((g) => g + 1);

          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setFlashMap(new Map()), 700);

          return updated;
        });
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [nextAt, intervalMinutes]);

  return { drinks, remaining, flashMap, flashGen };
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

const CATEGORIES: { value: DrinkCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',      label: 'Все',      emoji: '🍹' },
  { value: 'coffee',   label: 'Кофе',     emoji: '☕' },
  { value: 'lemonade', label: 'Лимонады', emoji: '🍋' },
  { value: 'tea',      label: 'Чаи',      emoji: '🍵' },
];

const CATEGORY_HEADER: Record<string, string> = {
  coffee:   '☕ Кофе',
  lemonade: '🍋 Лимонады',
  tea:      '🍵 Чаи',
};

function TrendArrow({ trend }: { trend: PriceTrend }) {
  if (trend === 'up')   return <TrendingUp  size={11} className="text-success shrink-0" />;
  if (trend === 'down') return <TrendingDown size={11} className="text-danger  shrink-0" />;
  return <Minus size={11} className="text-muted shrink-0" />;
}

function flashClass(trend: PriceTrend | undefined): string {
  if (!trend) return '';
  if (trend === 'up')      return 'price-flash-up';
  if (trend === 'down')    return 'price-flash-down';
  return 'price-flash-neutral';
}

// ─── Volume column (animated) ─────────────────────────────────────────────

function VolumeCol({
  vol,
  isFlashing,
  flashGen,
}: {
  vol: VolumePrice;
  isFlashing: boolean;
  flashGen: number;
}) {
  return (
    // Remounting via key forces CSS animation to replay on each flash
    <div
      key={isFlashing ? `${vol.value}-${flashGen}` : vol.value}
      className={cn(
        'flex flex-col items-center min-w-[52px] px-1 py-0.5',
        isFlashing && flashClass(vol.trend),
      )}
    >
      <span className="text-[10px] text-muted mb-0.5">{vol.label}</span>
      <span className="text-sm font-bold leading-tight">
        {Math.round(vol.price)} ₽
      </span>
      <div
        className={cn(
          'flex items-center gap-0.5 mt-0.5 text-[10px] font-medium',
          vol.trend === 'up'   ? 'text-success' :
          vol.trend === 'down' ? 'text-danger'  : 'text-muted',
        )}
      >
        <TrendArrow trend={vol.trend} />
        <span>{formatPriceChange(vol.change)}</span>
      </div>
    </div>
  );
}

// ─── Drink tile ───────────────────────────────────────────────────────────────

function DrinkTile({
  drink,
  isLocked,
  flashTrend,
  flashGen,
}: {
  drink: Drink;
  isLocked: boolean;
  flashTrend: PriceTrend | undefined;
  flashGen: number;
}) {
  return (
    <Link
      href={isLocked ? '/auth/login' : `/menu/${drink.id}`}
      className="flex items-center gap-3 bg-surface rounded-2xl p-3.5 active:scale-[0.98] transition-all hover:bg-surface-el group"
    >
      {/* Photo */}
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-el">
        {drink.photoUrl ? (
          <Image
            src={drink.photoUrl}
            alt={drink.name}
            fill
            className="object-cover"
            unoptimized
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {drink.category === 'coffee' ? '☕' : drink.category === 'lemonade' ? '🍋' : '🍵'}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm leading-tight truncate">{drink.name}</span>
          {isLocked && <Lock size={11} className="text-muted shrink-0" />}
        </div>
        <span className="text-xs text-muted">{drink.volume}</span>
      </div>

      {/* Volume prices — each column gets its own flash */}
      <div className="flex items-start gap-1 shrink-0">
        {drink.volumes.map((vol) => (
          <VolumeCol
            key={vol.value}
            vol={vol}
            isFlashing={!!flashTrend}
            flashGen={flashGen}
          />
        ))}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { country } = useCountry();
  const { user }    = useAuth();
  const [category, setCategory] = useState<DrinkCategory | 'all'>('all');
  const { drinks, remaining, flashMap, flashGen } = useLivePrices(country.id, 5);

  const filtered =
    category === 'all' ? drinks : drinks.filter((d) => d.category === category);

  const groups: { key: DrinkCategory; items: Drink[] }[] = [];
  for (const key of ['coffee', 'lemonade', 'tea'] as DrinkCategory[]) {
    const items = filtered.filter((d) => d.category === key);
    if (items.length > 0) groups.push({ key, items });
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold">Меню</h1>
            <p className="text-xs lg:text-sm text-muted mt-0.5">
              {country.name} · {filtered.length} позиций
            </p>
          </div>
        </div>

        {/* Countdown — главный акцент: крупный таймер до тика цен */}
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-orange/30 bg-gradient-to-br from-orange/[0.14] via-surface to-surface px-4 py-4 shadow-[0_0_40px_-8px_rgba(255,107,53,0.35)] sm:px-5 sm:py-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange/20 ring-1 ring-orange/30 sm:h-16 sm:w-16">
                <Timer className="h-8 w-8 text-orange sm:h-9 sm:w-9" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold leading-tight text-white sm:text-lg">
                  До обновления цен
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Следующий тик котировок — через
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-bg/40 px-4 py-3 ring-1 ring-white/5 sm:min-w-[11rem] sm:py-4">
              <span
                className="text-5xl font-extrabold tabular-nums tracking-tight text-orange sm:text-6xl lg:text-7xl"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCountdown(remaining)}
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                мин : сек
              </span>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-select">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                category === value
                  ? 'bg-orange text-white'
                  : 'bg-surface-el text-muted hover:text-white',
              )}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8 space-y-6 mt-3">
        {filtered.length === 0 && (
          <div className="text-center text-muted py-16">Нет позиций</div>
        )}

        {groups.map(({ key, items }) => (
          <section key={key}>
            <h2 className="text-base font-bold mb-2 px-0.5">{CATEGORY_HEADER[key]}</h2>
            <div className="space-y-2">
              {items.map((drink) => (
                <DrinkTile
                  key={drink.id}
                  drink={drink}
                  isLocked={!user}
                  flashTrend={flashMap.get(drink.id)}
                  flashGen={flashGen}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

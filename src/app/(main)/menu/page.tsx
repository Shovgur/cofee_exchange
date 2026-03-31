'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Lock, Timer } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDrinksByCountry } from '@/lib/mock-data';
import {
  cn,
  formatPrice,
  formatPriceChange,
  getNextPriceUpdateAt,
  formatCountdown,
} from '@/lib/utils';
import type { Drink, DrinkCategory } from '@/types';

const CATEGORIES: { value: DrinkCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',      label: 'Все',       emoji: '🍹' },
  { value: 'coffee',   label: 'Кофе',      emoji: '☕' },
  { value: 'lemonade', label: 'Лимонады',  emoji: '🍋' },
  { value: 'tea',      label: 'Чаи',       emoji: '🍵' },
];

const CATEGORY_HEADER: Record<string, string> = {
  coffee:   '☕ Кофе',
  lemonade: '🍋 Лимонады',
  tea:      '🍵 Чаи',
};

function TrendArrow({ trend }: { trend: string }) {
  if (trend === 'up')   return <TrendingUp  size={11} className="text-success shrink-0" />;
  if (trend === 'down') return <TrendingDown size={11} className="text-danger  shrink-0" />;
  return <Minus size={11} className="text-muted shrink-0" />;
}

/** Таймер до следующего обновления цен */
function usePriceCountdown(intervalMinutes = 5) {
  const [nextAt, setNextAt]     = useState<number>(() => getNextPriceUpdateAt(intervalMinutes));
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = nextAt - now;
      if (diff <= 0) {
        const next = getNextPriceUpdateAt(intervalMinutes);
        setNextAt(next);
        setRemaining(next - Date.now());
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextAt, intervalMinutes]);

  return remaining;
}

function DrinkTile({ drink, isLocked }: { drink: Drink; isLocked: boolean }) {
  const href = isLocked ? '/auth/login' : `/menu/${drink.id}`;

  return (
    <Link
      href={href}
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

      {/* Volume prices */}
      <div className="flex items-start gap-2 shrink-0">
        {drink.volumes.map((vol) => (
          <div key={vol.value} className="flex flex-col items-center min-w-[52px]">
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
        ))}
      </div>
    </Link>
  );
}

export default function MenuPage() {
  const { country } = useCountry();
  const { user }    = useAuth();
  const drinks      = getDrinksByCountry(country.id);
  const [category, setCategory] = useState<DrinkCategory | 'all'>('all');
  const remaining   = usePriceCountdown(5);

  const filtered =
    category === 'all' ? drinks : drinks.filter((d) => d.category === category);

  // Group by category for section headers
  const groups: { key: DrinkCategory; items: Drink[] }[] = [];
  const order: DrinkCategory[] = ['coffee', 'lemonade', 'tea'];
  for (const key of order) {
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

        {/* Countdown banner */}
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2 mb-3 border border-border">
          <Timer size={14} className="text-orange shrink-0" />
          <span className="text-xs text-muted">До обновления цен:</span>
          <span className="text-sm font-bold text-orange tabular-nums ml-auto">
            {formatCountdown(remaining)}
          </span>
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
                <DrinkTile key={drink.id} drink={drink} isLocked={!user} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDrinksByCountry } from '@/lib/mock-data';
import {
  cn,
  formatPrice,
  formatPriceChange,
  trendBg,
} from '@/lib/utils';
import type { DrinkCategory } from '@/types';

const CATEGORIES: { value: DrinkCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'coffee', label: 'Кофе' },
  { value: 'lemonade', label: 'Лимонады' },
  { value: 'tea', label: 'Чаи' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  coffee: '☕',
  lemonade: '🍋',
  tea: '🍵',
};

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-success" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-danger" />;
  return <Minus size={14} className="text-muted" />;
}

export default function MenuPage() {
  const { country } = useCountry();
  const { user } = useAuth();
  const drinks = getDrinksByCountry(country.id);
  const [category, setCategory] = useState<DrinkCategory | 'all'>('all');

  const filtered =
    category === 'all' ? drinks : drinks.filter((d) => d.category === category);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold">Меню</h1>
            <p className="text-xs lg:text-sm text-muted mt-0.5">
              {country.flag} {country.name} · {filtered.length} позиций
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-select">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                category === value
                  ? 'bg-orange text-white'
                  : 'bg-surface-el text-muted hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8">
        {/* Desktop: legend */}
        <div className="hidden lg:flex items-center justify-between text-xs text-muted py-3 border-b border-border mb-1">
          <span>Напиток</span>
          <span>Цена / изменение</span>
        </div>

        {/* Mobile: single list. Desktop: 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-2 lg:mt-0">
          {filtered.map((drink) => {
            const isLocked = !user;
            return (
              <Link
                key={drink.id}
                href={isLocked ? '/auth/login' : `/menu/${drink.id}`}
                className="flex items-center gap-3 bg-surface rounded-2xl p-3.5 active:scale-[0.98] transition-all hover:bg-surface-el group"
              >
                {/* Category icon */}
                <div className="w-11 h-11 rounded-xl bg-surface-el group-hover:bg-surface-ov flex items-center justify-center flex-shrink-0 text-xl transition-colors">
                  {CATEGORY_EMOJI[drink.category] ?? '☕'}
                </div>

                {/* Name & volume */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{drink.name}</span>
                    {isLocked && <Lock size={11} className="text-muted flex-shrink-0" />}
                  </div>
                  <span className="text-xs text-muted">{drink.volume}</span>
                </div>

                {/* Price & change */}
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-sm">
                    {formatPrice(drink.currentPrice, country.currencySymbol)}
                  </div>
                  <div
                    className={cn(
                      'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs mt-0.5',
                      trendBg(drink.trend),
                    )}
                  >
                    <TrendIcon trend={drink.trend} />
                    <span>{formatPriceChange(drink.priceChange)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

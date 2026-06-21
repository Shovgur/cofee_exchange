'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useCountry } from '@/contexts/CountryContext';
import {
  usePrices,
} from '@/contexts/PricesContext';
import { PriceRefreshBanner } from '@/components/menu/PriceRefreshBanner';
import { cn, formatPrice } from '@/lib/utils';
import type { Drink, DrinkCategory } from '@/types';

const CATEGORY_ORDER: DrinkCategory[] = ['coffee', 'tea', 'lemonade'];
const CATEGORY_TITLE: Record<DrinkCategory, string> = {
  coffee: 'Кофе',
  tea: 'Чай',
  lemonade: 'Лимонады',
};

function formatClock(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function TvMenuPage() {
  const { country } = useCountry();
  const { drinks, loading, error, secondsUntilNextPoll, flashMap, flashGen } = usePrices();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<DrinkCategory, Drink[]>();
    for (const c of CATEGORY_ORDER) m.set(c, []);
    for (const d of drinks) {
      const list = m.get(d.category);
      if (list) list.push(d);
    }
    return m;
  }, [drinks]);

  const hasAny = drinks.length > 0;

  return (
    <div className="min-h-[100dvh] bg-bg text-foreground flex flex-col overflow-hidden">
      {/* Верхняя плашка: бренд + регион + время */}
      <header className="shrink-0 border-b border-border bg-surface px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2vw,1.25rem)] flex flex-col gap-[clamp(0.65rem,1.8vw,1rem)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-[clamp(0.75rem,2vw,1.5rem)] min-w-0">
          <div className="flex h-[clamp(2.5rem,6vw,4rem)] w-[clamp(2.5rem,6vw,4rem)] shrink-0 items-center justify-center rounded-2xl bg-orange/15 text-[clamp(1.25rem,3vw,2rem)]">
            ☕
          </div>
          <div className="min-w-0">
            <h1
              className="font-bold tracking-tight leading-none"
              style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}
            >
              <span className="text-foreground">Coffee</span>{' '}
              <span className="text-orange">Exchange</span>
            </h1>
            <p
              className="text-muted mt-1 capitalize truncate"
              style={{ fontSize: 'clamp(0.75rem, 1.8vw, 1.125rem)' }}
            >
              Меню · {country.flag} {country.name}
            </p>
          </div>
        </div>
        <div className="text-right tabular-nums">
          <div
            className="font-semibold text-orange"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.75rem)' }}
          >
            {formatClock(now)}
          </div>
          <div
            className="text-muted capitalize"
            style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }}
          >
            {formatDate(now)}
          </div>
        </div>
        </div>
        <PriceRefreshBanner
          variant="tv"
          loading={loading}
          secondsUntilNextPoll={secondsUntilNextPoll}
        />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2vw,1.5rem)]">
        {loading && (
          <div className="h-full flex items-center justify-center text-muted text-xl">
            Загрузка меню…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-6 text-center text-danger max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {!loading && !error && !hasAny && (
          <div className="h-full flex items-center justify-center text-muted text-xl">
            Пока нет позиций
          </div>
        )}

        {!loading && !error && hasAny && (
          <div className="space-y-[clamp(1.25rem,3vw,2.5rem)] max-w-[1800px] mx-auto">
            {CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (items.length === 0) return null;

              return (
                <section key={cat}>
                  <h2
                    className="font-bold text-orange mb-[clamp(0.5rem,1.5vw,1rem)] pb-2 border-b border-orange/25"
                    style={{ fontSize: 'clamp(1.25rem, 3vw, 2.25rem)' }}
                  >
                    {CATEGORY_TITLE[cat]}
                  </h2>

                  <div className="grid gap-[clamp(0.5rem,1.2vw,0.85rem)] grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((drink) => {
                      const flashTrend = flashMap.get(drink.id);
                      return (
                      <article
                        key={flashTrend ? `${drink.id}-${flashGen}` : drink.id}
                        className={cn(
                          'flex items-stretch gap-[clamp(0.5rem,1.5vw,1rem)] rounded-2xl border border-border bg-surface p-[clamp(0.5rem,1.5vw,1rem)] transition-[border-color,box-shadow] duration-300',
                          flashTrend === 'up' && 'tv-tile-update-up',
                          flashTrend === 'down' && 'tv-tile-update-down',
                          flashTrend === 'neutral' && 'tv-tile-update-neutral',
                        )}
                      >
                          <div className="relative h-[clamp(3.5rem,10vw,5.5rem)] w-[clamp(3.5rem,10vw,5.5rem)] shrink-0 rounded-xl overflow-hidden bg-surface-el">
                            {drink.photoUrl ? (
                              <Image
                                src={drink.photoUrl}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="120px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">
                                {cat === 'coffee' ? '☕' : cat === 'tea' ? '🍵' : '🍋'}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                            <h3
                              className="font-semibold text-foreground leading-tight line-clamp-2"
                              style={{ fontSize: 'clamp(1rem, 2.4vw, 1.65rem)' }}
                            >
                              {drink.name}
                            </h3>
                            <div className="flex flex-wrap gap-x-[clamp(0.5rem,2vw,1.25rem)] gap-y-1">
                              {drink.volumes.map((v) => (
                                <div
                                  key={flashTrend ? `${v.value}-${flashGen}` : v.value}
                                  className="flex items-baseline gap-2 text-foreground"
                                >
                                  <span
                                    className="text-muted"
                                    style={{ fontSize: 'clamp(0.65rem, 1.5vw, 1rem)' }}
                                  >
                                    {v.label}
                                  </span>
                                    <span
                                    className={cn(
                                      'font-bold tabular-nums text-foreground',
                                      flashTrend === 'up' && 'tv-dp-price-up',
                                      flashTrend === 'down' && 'tv-dp-price-down',
                                      flashTrend === 'neutral' && 'tv-dp-price-neutral',
                                    )}
                                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.85rem)' }}
                                  >
                                    {formatPrice(v.price, country.currencySymbol)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                    );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-border py-2.5 text-center text-muted text-[clamp(0.65rem,1.4vw,0.9rem)] bg-surface/80">
        Coffee Exchange · живые цены с биржи
      </footer>
    </div>
  );
}

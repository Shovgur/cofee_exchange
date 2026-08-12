'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import type { Country, PriceTrend } from '@/types';
import type { TvMenuConfig, TvMenuBackground } from '@/lib/tv-menu/config';
import {
  CATEGORY_EMOJI,
  type ResolvedScreen,
  type ResolvedSection,
} from '@/lib/tv-menu/resolve';
import { PriceRefreshBanner } from '@/components/menu/PriceRefreshBanner';

/**
 * Палитра доски не зависит от темы приложения: телевизор в зале обычно
 * настраивают отдельно от интерфейса кассы.
 */
const PALETTE: Record<TvMenuBackground, Record<string, string>> = {
  dark: {
    '--tv-bg': '#14100d',
    '--tv-surface': '#1e1814',
    '--tv-surface-el': '#2a221c',
    '--tv-border': '#3a2f27',
    '--tv-text': '#f5efe8',
    '--tv-muted': '#a99a8c',
  },
  light: {
    '--tv-bg': '#f0e4d8',
    '--tv-surface': '#ffffff',
    '--tv-surface-el': '#f7efe6',
    '--tv-border': '#c4b09a',
    '--tv-text': '#2f241c',
    '--tv-muted': '#6e5f54',
  },
};

const DENSITY_GAP: Record<TvMenuConfig['layout']['density'], number> = {
  compact: 0.006,
  normal: 0.01,
  spacious: 0.016,
};

/**
 * Размеры считаются от ширины самой доски, а не от вьюпорта: так один и тот же
 * компонент одинаково выглядит на телевизоре и в уменьшенном превью админки.
 */
function scaled(ratio: number, min: string, max: string): string {
  return `clamp(${min}, calc(var(--tv-w) * ${ratio} * var(--tv-fs)), ${max})`;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(1280);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width || 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

function formatClock(d: Date) {
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
}

function TrendMark({ trend }: { trend: PriceTrend }) {
  if (trend === 'neutral') return null;
  const up = trend === 'up';
  return (
    <span
      className="font-semibold tabular-nums"
      style={{
        color: up ? '#15803d' : '#c62828',
        fontSize: scaled(0.011, '0.55rem', '0.9rem'),
      }}
    >
      {up ? '▲' : '▼'}
    </span>
  );
}

function SectionGrid({
  section,
  config,
  country,
  columns,
  flashMap,
  flashGen,
}: {
  section: ResolvedSection;
  config: TvMenuConfig;
  country: Country;
  columns: number;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
}) {
  const { layout } = config;
  const gap = DENSITY_GAP[layout.density];

  return (
    <section>
      {section.title.trim() && (
        <h2
          className="font-bold border-b pb-[0.35em]"
          style={{
            color: 'var(--tv-accent)',
            borderColor: 'color-mix(in srgb, var(--tv-accent) 25%, transparent)',
            fontSize: scaled(0.028, '1.1rem', '2.25rem'),
            marginBottom: scaled(0.014, '0.5rem', '1rem'),
          }}
        >
          {section.title}
        </h2>
      )}

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: scaled(gap, '0.35rem', '1.1rem'),
        }}
      >
        {section.items.map(({ drink, volumes }) => {
          const flashTrend = flashMap.get(drink.id);
          const key = flashTrend ? `${drink.id}-${flashGen}` : drink.id;

          return (
            <article
              key={key}
              className={cn(
                'flex items-stretch rounded-2xl border transition-[border-color,box-shadow] duration-300',
                flashTrend === 'up' && 'tv-tile-update-up',
                flashTrend === 'down' && 'tv-tile-update-down',
                flashTrend === 'neutral' && 'tv-tile-update-neutral',
              )}
              style={{
                background: 'var(--tv-surface)',
                borderColor: 'var(--tv-border)',
                gap: scaled(0.012, '0.4rem', '1rem'),
                padding: scaled(0.01, '0.4rem', '1rem'),
              }}
            >
              {layout.showPhotos && (
                <div
                  className="relative shrink-0 overflow-hidden rounded-xl"
                  style={{
                    background: 'var(--tv-surface-el)',
                    height: scaled(0.062, '2.75rem', '5.5rem'),
                    width: scaled(0.062, '2.75rem', '5.5rem'),
                  }}
                >
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
                    <div
                      className="flex h-full w-full items-center justify-center opacity-50"
                      style={{ fontSize: scaled(0.026, '1rem', '2rem') }}
                    >
                      {CATEGORY_EMOJI[drink.category]}
                    </div>
                  )}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col justify-center gap-[0.25em]">
                <h3
                  className="font-semibold leading-tight line-clamp-2"
                  style={{
                    color: 'var(--tv-text)',
                    fontSize: scaled(0.024, '0.8rem', '1.65rem'),
                  }}
                >
                  {drink.name}
                </h3>

                <div
                  className="flex flex-wrap"
                  style={{
                    columnGap: scaled(0.018, '0.4rem', '1.25rem'),
                    rowGap: scaled(0.004, '0.15rem', '0.35rem'),
                  }}
                >
                  {volumes.map((v) => (
                    <div
                      key={flashTrend ? `${v.value}-${flashGen}` : v.value}
                      className="flex items-baseline gap-[0.4em]"
                    >
                      <span
                        style={{
                          color: 'var(--tv-muted)',
                          fontSize: scaled(0.015, '0.55rem', '1rem'),
                        }}
                      >
                        {v.label}
                      </span>
                      <span
                        className={cn(
                          'font-bold tabular-nums',
                          flashTrend === 'up' && 'tv-dp-price-up',
                          flashTrend === 'down' && 'tv-dp-price-down',
                          flashTrend === 'neutral' && 'tv-dp-price-neutral',
                        )}
                        style={{
                          color: 'var(--tv-text)',
                          fontSize: scaled(0.025, '0.8rem', '1.85rem'),
                        }}
                      >
                        {formatPrice(v.price, country.currencySymbol)}
                      </span>
                      {layout.showTrends && <TrendMark trend={v.trend} />}
                      {layout.showBeanPrices && v.priceBeans != null && (
                        <span
                          className="font-semibold tabular-nums"
                          style={{
                            color: 'var(--tv-accent)',
                            fontSize: scaled(0.013, '0.5rem', '0.95rem'),
                          }}
                        >
                          {v.priceBeans} Б
                        </span>
                      )}
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
}

export interface TvMenuBoardProps {
  config: TvMenuConfig;
  screen: ResolvedScreen | undefined;
  country: Country;
  loading?: boolean;
  error?: string | null;
  secondsUntilNextPoll?: number | null;
  flashMap?: Map<string, PriceTrend>;
  flashGen?: number;
  /** Индикатор ротации: показывается, только когда экранов больше одного. */
  screenCount?: number;
  screenIndex?: number;
  className?: string;
}

const EMPTY_FLASH = new Map<string, PriceTrend>();

export default function TvMenuBoard({
  config,
  screen,
  country,
  loading = false,
  error = null,
  secondsUntilNextPoll = null,
  flashMap = EMPTY_FLASH,
  flashGen = 0,
  screenCount = 1,
  screenIndex = 0,
  className,
}: TvMenuBoardProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!config.header.showClock) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [config.header.showClock]);

  const sections = (screen?.sections ?? []).filter((s) => s.items.length > 0);
  const hasAny = sections.length > 0;

  const rootStyle = {
    ...PALETTE[config.theme.background],
    '--tv-accent': config.theme.accent,
    '--tv-w': `${width}px`,
    '--tv-fs': String(config.layout.fontScale),
    background: 'var(--tv-bg)',
    color: 'var(--tv-text)',
  } as React.CSSProperties;

  const pad = scaled(0.026, '0.75rem', '2.5rem');

  return (
    <div ref={ref} className={cn('flex h-full flex-col overflow-hidden', className)} style={rootStyle}>
      <header
        className="flex shrink-0 flex-col border-b"
        style={{
          background: 'var(--tv-surface)',
          borderColor: 'var(--tv-border)',
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: scaled(0.016, '0.5rem', '1.25rem'),
          paddingBottom: scaled(0.016, '0.5rem', '1.25rem'),
          gap: scaled(0.014, '0.45rem', '1rem'),
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-[1em]">
          <div className="flex min-w-0 items-center" style={{ gap: scaled(0.016, '0.5rem', '1.5rem') }}>
            {config.header.logoEmoji && (
              <div
                className="flex shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: 'color-mix(in srgb, var(--tv-accent) 15%, transparent)',
                  height: scaled(0.05, '1.75rem', '4rem'),
                  width: scaled(0.05, '1.75rem', '4rem'),
                  fontSize: scaled(0.024, '0.9rem', '2rem'),
                }}
              >
                {config.header.logoEmoji}
              </div>
            )}
            <div className="min-w-0">
              <h1
                className="font-bold leading-none tracking-tight"
                style={{ fontSize: scaled(0.036, '1rem', '3rem') }}
              >
                <span style={{ color: 'var(--tv-text)' }}>{config.header.title}</span>{' '}
                <span style={{ color: 'var(--tv-accent)' }}>{config.header.accentWord}</span>
              </h1>
              <p
                className="mt-1 truncate capitalize"
                style={{
                  color: 'var(--tv-muted)',
                  fontSize: scaled(0.015, '0.6rem', '1.125rem'),
                }}
              >
                {config.header.subtitle} · {country.flag} {country.name}
                {screenCount > 1 && screen?.title ? ` · ${screen.title}` : ''}
              </p>
            </div>
          </div>

          {config.header.showClock && (
            <div className="text-right tabular-nums">
              <div
                className="font-semibold"
                style={{
                  color: 'var(--tv-accent)',
                  fontSize: scaled(0.034, '1rem', '2.75rem'),
                }}
              >
                {now ? formatClock(now) : '--:--'}
              </div>
              <div
                className="capitalize"
                style={{
                  color: 'var(--tv-muted)',
                  fontSize: scaled(0.013, '0.55rem', '1rem'),
                }}
              >
                {now ? formatDate(now) : ''}
              </div>
            </div>
          )}
        </div>

        {config.header.showRefreshBanner && (
          <PriceRefreshBanner
            variant="tv"
            loading={loading}
            secondsUntilNextPoll={secondsUntilNextPoll}
          />
        )}
      </header>

      <main
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: scaled(0.016, '0.5rem', '1.5rem'),
          paddingBottom: scaled(0.016, '0.5rem', '1.5rem'),
        }}
      >
        {loading && !hasAny && (
          <div className="flex h-full items-center justify-center" style={{ color: 'var(--tv-muted)' }}>
            Загрузка меню…
          </div>
        )}

        {!loading && error && (
          <div
            className="mx-auto max-w-2xl rounded-2xl border p-6 text-center"
            style={{ borderColor: '#c6282866', background: '#c628281a', color: '#c62828' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && !hasAny && (
          <div className="flex h-full items-center justify-center" style={{ color: 'var(--tv-muted)' }}>
            Пока нет позиций
          </div>
        )}

        {!error && hasAny && (
          <div
            className="mx-auto flex max-w-[1800px] flex-col"
            style={{ gap: scaled(0.028, '0.85rem', '2.5rem') }}
          >
            {sections.map((section) => (
              <SectionGrid
                key={section.id}
                section={section}
                config={config}
                country={country}
                columns={section.columns ?? config.layout.columns}
                flashMap={flashMap}
                flashGen={flashGen}
              />
            ))}
          </div>
        )}
      </main>

      {config.ticker.enabled && config.ticker.text.trim() && (
        <div
          className="shrink-0 overflow-hidden border-t py-[0.5em]"
          style={{
            borderColor: 'var(--tv-border)',
            background: 'color-mix(in srgb, var(--tv-accent) 10%, var(--tv-surface))',
          }}
        >
          <div
            className="tv-ticker whitespace-nowrap font-medium"
            style={{
              color: 'var(--tv-text)',
              fontSize: scaled(0.018, '0.65rem', '1.35rem'),
              animationDuration: `${config.ticker.speedSec}s`,
            }}
          >
            {config.ticker.text}
          </div>
        </div>
      )}

      <footer
        className="shrink-0 border-t py-[0.6em] text-center"
        style={{
          borderColor: 'var(--tv-border)',
          background: 'var(--tv-surface)',
          color: 'var(--tv-muted)',
          fontSize: scaled(0.012, '0.5rem', '0.9rem'),
        }}
      >
        <span>{config.footer}</span>
        {screenCount > 1 && (
          <span className="ml-3 inline-flex items-center gap-1 align-middle">
            {Array.from({ length: screenCount }).map((_, i) => (
              <span
                key={i}
                className="inline-block rounded-full"
                style={{
                  width: '0.5em',
                  height: '0.5em',
                  background: i === screenIndex ? 'var(--tv-accent)' : 'var(--tv-border)',
                }}
              />
            ))}
          </span>
        )}
      </footer>
    </div>
  );
}

'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import type { Country, PriceTrend, VolumePrice } from '@/types';
import {
  boardWidthCm,
  GRID_COLUMNS,
  GRID_ROWS,
  type TvBoardConfig,
  type TvMenuBackground,
  type TvMenuSection,
} from '@/lib/tv-menu/config';
import {
  CATEGORY_EMOJI,
  sectionHasContent,
  sectionVolumeColumns,
  type ResolvedScreen,
  type ResolvedSection,
} from '@/lib/tv-menu/resolve';
import { PriceRefreshBanner } from '@/components/menu/PriceRefreshBanner';
import TvPriceChart from '@/components/tv-menu/TvPriceChart';

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

const UP_COLOR = '#15803d';
const DOWN_COLOR = '#c62828';

/** Отступы между блоками, в сантиметрах. */
const DENSITY_GAP: Record<TvBoardConfig['layout']['density'], number> = {
  compact: 0.5,
  normal: 0.9,
  spacious: 1.35,
};

/**
 * Все размеры заданы в сантиметрах реального экрана: `--tv-cm` — это сколько
 * пикселей приходится на один сантиметр доски. Поэтому диагональ меняет не
 * размер надписей, а количество места: чем больше телевизор, тем больше
 * позиций помещается при том же физическом кегле. Масштаб 100 % — ровно 1:1.
 */
function cm(value: number): string {
  return `calc(var(--tv-cm) * ${value} * var(--tv-fs))`;
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

function trendColor(change: number): string {
  if (change > 0.5) return UP_COLOR;
  if (change < -0.5) return DOWN_COLOR;
  return 'var(--tv-muted)';
}

function PercentBadge({ change, size }: { change: number; size: string }) {
  const rounded = Math.round(change);
  if (rounded === 0) return null;
  return (
    <span
      className="font-semibold tabular-nums"
      style={{ color: trendColor(change), fontSize: size }}
    >
      {rounded > 0 ? '+' : '−'}
      {Math.abs(rounded)}%
    </span>
  );
}

function TrendMark({ trend, size }: { trend: PriceTrend; size: string }) {
  if (trend === 'neutral') return null;
  const up = trend === 'up';
  return (
    <span
      className="font-semibold"
      style={{ color: up ? UP_COLOR : DOWN_COLOR, fontSize: size }}
    >
      {up ? '▲' : '▼'}
    </span>
  );
}

/** Цена + опциональные стрелка, процент и цена в Бинах. */
function PriceCell({
  volume,
  board,
  country,
  priceSize,
  metaSize,
  withLabel,
}: {
  volume: VolumePrice;
  board: TvBoardConfig;
  country: Country;
  priceSize: string;
  metaSize: string;
  withLabel: boolean;
}) {
  const { layout } = board;
  return (
    <span className="inline-flex items-baseline gap-[0.35em] whitespace-nowrap">
      {withLabel && (
        <span style={{ color: 'var(--tv-muted)', fontSize: metaSize }}>{volume.label}</span>
      )}
      <span
        className="font-bold tabular-nums"
        style={{ color: 'var(--tv-text)', fontSize: priceSize }}
      >
        {formatPrice(volume.price, country.currencySymbol)}
      </span>
      {layout.showTrends && <TrendMark trend={volume.trend} size={metaSize} />}
      {layout.showPercent && <PercentBadge change={volume.change} size={metaSize} />}
      {layout.showBeanPrices && volume.priceBeans != null && (
        <span
          className="font-semibold tabular-nums"
          style={{ color: 'var(--tv-accent)', fontSize: metaSize }}
        >
          {volume.priceBeans} Б
        </span>
      )}
    </span>
  );
}

// ── Режимы отображения напитков ───────────────────────────────────────────

function CardsGrid({
  resolved,
  board,
  country,
  flashMap,
  flashGen,
}: {
  resolved: ResolvedSection;
  board: TvBoardConfig;
  country: Country;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
}) {
  const { section, items } = resolved;
  // Авто-режим: примерно одна карточка на треть ширины экрана.
  const columns =
    section.columns ??
    Math.max(1, Math.round(section.rect.w / (GRID_COLUMNS / 3)));

  return (
    <div
      className="grid min-h-0"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: cm(DENSITY_GAP[board.layout.density]),
      }}
    >
      {items.map(({ drink, volumes }) => {
        const flashTrend = flashMap.get(drink.id);
        return (
          <article
            key={flashTrend ? `${drink.id}-${flashGen}` : drink.id}
            className={cn(
              'flex items-stretch rounded-xl border transition-[border-color,box-shadow] duration-300',
              flashTrend === 'up' && 'tv-tile-update-up',
              flashTrend === 'down' && 'tv-tile-update-down',
              flashTrend === 'neutral' && 'tv-tile-update-neutral',
            )}
            style={{
              background: 'var(--tv-surface-el)',
              borderColor: 'var(--tv-border)',
              gap: cm(0.96),
              padding: cm(0.77),
            }}
          >
            {board.layout.showPhotos && (
              <div
                className="relative shrink-0 overflow-hidden rounded-lg"
                style={{
                  background: 'var(--tv-surface)',
                  height: cm(4.8),
                  width: cm(4.8),
                }}
              >
                {drink.photoUrl ? (
                  // Фото приходят с произвольных доменов, next/image потребовал бы их регистрации.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={drink.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center opacity-50"
                    style={{ fontSize: cm(2.11) }}
                  >
                    {CATEGORY_EMOJI[drink.category]}
                  </div>
                )}
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[0.2em]">
              <h3
                className="font-semibold leading-tight line-clamp-2"
                style={{ color: 'var(--tv-text)', fontSize: cm(1.92) }}
              >
                {drink.name}
              </h3>
              <div
                className="flex flex-wrap items-baseline"
                style={{ columnGap: cm(1.34), rowGap: cm(0.29) }}
              >
                {volumes.map((v) => (
                  <PriceCell
                    key={flashTrend ? `${v.value}-${flashGen}` : v.value}
                    volume={v}
                    board={board}
                    country={country}
                    priceSize={cm(2.11)}
                    metaSize={cm(1.15)}
                    withLabel
                  />
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ListRows({
  resolved,
  board,
  country,
  flashMap,
  flashGen,
}: {
  resolved: ResolvedSection;
  board: TvBoardConfig;
  country: Country;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
}) {
  const { items } = resolved;

  return (
    <div className="flex min-h-0 flex-col">
      {items.map(({ drink, volumes }) => {
        const flashTrend = flashMap.get(drink.id);
        return (
          <div
            key={flashTrend ? `${drink.id}-${flashGen}` : drink.id}
            className={cn(
              'flex items-center border-b last:border-0',
              flashTrend === 'up' && 'tv-dp-price-up',
              flashTrend === 'down' && 'tv-dp-price-down',
            )}
            style={{
              borderColor: 'var(--tv-border)',
              gap: cm(1.15),
              paddingTop: cm(0.48),
              paddingBottom: cm(0.48),
            }}
          >
            {board.layout.showPhotos && drink.photoUrl && (
              <div
                className="relative shrink-0 overflow-hidden rounded-md"
                style={{ height: cm(3.07), width: cm(3.07) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={drink.photoUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <span
              className="min-w-0 flex-1 truncate font-medium"
              style={{ color: 'var(--tv-text)', fontSize: cm(1.82) }}
            >
              {drink.name}
            </span>
            <span className="flex shrink-0 items-baseline" style={{ gap: cm(1.15) }}>
              {volumes.map((v) => (
                <PriceCell
                  key={v.value}
                  volume={v}
                  board={board}
                  country={country}
                  priceSize={cm(2.02)}
                  metaSize={cm(1.15)}
                  withLabel={volumes.length > 1}
                />
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Объёмы выносятся в шапку один раз, ниже — строки напитков.
 *
 * Вся таблица — одна CSS-сетка: если каждую строку рисовать своей сеткой,
 * колонки считаются независимо и подписи объёмов расходятся с ценами.
 */
function VolumeTable({
  resolved,
  board,
  country,
}: {
  resolved: ResolvedSection;
  board: TvBoardConfig;
  country: Country;
}) {
  const { items } = resolved;
  const columns = sectionVolumeColumns(items);
  const priceSize = cm(2.02);
  const metaSize = cm(1.15);
  const nameSize = cm(1.82);
  const cellPad = cm(0.48);

  return (
    <div
      className="grid min-h-0 items-baseline"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) repeat(${columns.length}, minmax(0, max-content))`,
        columnGap: cm(1.54),
      }}
    >
      {/* Шапка: подписи объёмов ровно над своими колонками */}
      <span style={{ borderBottom: '1px solid var(--tv-accent)', paddingBottom: cellPad }} />
      {columns.map((label) => (
        <span
          key={label}
          className="text-right font-bold uppercase tracking-wider"
          style={{
            color: 'var(--tv-accent)',
            fontSize: metaSize,
            borderBottom: '1px solid var(--tv-accent)',
            paddingBottom: cellPad,
          }}
        >
          {label}
        </span>
      ))}

      {items.map(({ drink, volumes }, rowIndex) => {
        const byLabel = new Map(volumes.map((v) => [v.label, v]));
        const isLast = rowIndex === items.length - 1;
        const cellStyle: React.CSSProperties = {
          borderBottom: isLast ? 'none' : '1px solid var(--tv-border)',
          paddingTop: cellPad,
          paddingBottom: cellPad,
        };

        return (
          <Fragment key={drink.id}>
            <span
              className="min-w-0 truncate font-medium"
              style={{ ...cellStyle, color: 'var(--tv-text)', fontSize: nameSize }}
            >
              {drink.name}
            </span>

            {columns.map((label) => {
              const v = byLabel.get(label);
              return (
                <span key={label} className="text-right" style={cellStyle}>
                  {v ? (
                    <PriceCell
                      volume={v}
                      board={board}
                      country={country}
                      priceSize={priceSize}
                      metaSize={metaSize}
                      withLabel={false}
                    />
                  ) : (
                    <span style={{ color: 'var(--tv-muted)', fontSize: metaSize }}>—</span>
                  )}
                </span>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Секция-график: название, объём, текущая цена и кривая акцентным цветом. */
function ChartBlock({
  resolved,
  board,
  country,
}: {
  resolved: ResolvedSection;
  board: TvBoardConfig;
  country: Country;
}) {
  const { chart } = resolved;
  if (!chart) return null;
  const { drink, volume } = chart;

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap: cm(0.48) }}>
      <div
        className="flex shrink-0 flex-wrap items-baseline justify-between"
        style={{ columnGap: cm(1.15) }}
      >
        <span className="flex items-baseline" style={{ gap: cm(0.77) }}>
          <span
            className="font-semibold"
            style={{ color: 'var(--tv-text)', fontSize: cm(1.92) }}
          >
            {drink.name}
          </span>
          <span
            className="font-medium"
            style={{ color: 'var(--tv-accent)', fontSize: cm(1.34) }}
          >
            {volume.label}
          </span>
        </span>
        <span className="flex items-baseline" style={{ gap: cm(0.58) }}>
          <span
            className="font-bold tabular-nums"
            style={{ color: 'var(--tv-text)', fontSize: cm(2.11) }}
          >
            {formatPrice(volume.price, country.currencySymbol)}
          </span>
          <PercentBadge change={volume.change} size={cm(1.25)} />
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <TvPriceChart
          points={volume.priceHistory}
          color={board.theme.accent}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

function MediaBlock({ section }: { section: TvMenuSection }) {
  if (!section.mediaUrl.trim()) return null;
  const objectFit = section.mediaFit === 'contain' ? 'object-contain' : 'object-cover';

  if (section.mediaType === 'video') {
    return (
      <video
        src={section.mediaUrl}
        className={cn('h-full w-full', objectFit)}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={section.mediaUrl} alt="" className={cn('h-full w-full', objectFit)} />
  );
}

// ── Секция ────────────────────────────────────────────────────────────────

function SectionBlock({
  resolved,
  board,
  country,
  flashMap,
  flashGen,
}: {
  resolved: ResolvedSection;
  board: TvBoardConfig;
  country: Country;
  flashMap: Map<string, PriceTrend>;
  flashGen: number;
}) {
  const { section } = resolved;
  const isMedia = section.kind === 'media';

  return (
    <div
      className={cn('flex min-h-0 min-w-0 flex-col overflow-hidden', section.showFrame && 'rounded-2xl border')}
      style={{
        gridColumn: `${section.rect.x + 1} / span ${section.rect.w}`,
        gridRow: `${section.rect.y + 1} / span ${section.rect.h}`,
        background: isMedia ? 'transparent' : (section.background ?? 'var(--tv-surface)'),
        borderColor: section.showFrame ? 'var(--tv-border)' : 'transparent',
        padding: isMedia ? 0 : cm(1.06),
      }}
    >
      {!isMedia && section.title.trim() && (
        <h2
          className="shrink-0 border-b font-bold"
          style={{
            color: 'var(--tv-accent)',
            borderColor: 'color-mix(in srgb, var(--tv-accent) 25%, transparent)',
            fontSize: cm(2.3),
            paddingBottom: cm(0.38),
            marginBottom: cm(0.77),
          }}
        >
          {section.title}
        </h2>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        {section.kind === 'media' && <MediaBlock section={section} />}

        {section.kind === 'text' && (
          <p
            className="whitespace-pre-wrap"
            style={{ color: 'var(--tv-text)', fontSize: cm(1.73) }}
          >
            {section.text}
          </p>
        )}

        {section.kind === 'drinks' && section.display === 'cards' && (
          <CardsGrid
            resolved={resolved}
            board={board}
            country={country}
            flashMap={flashMap}
            flashGen={flashGen}
          />
        )}
        {section.kind === 'drinks' && section.display === 'list' && (
          <ListRows
            resolved={resolved}
            board={board}
            country={country}
            flashMap={flashMap}
            flashGen={flashGen}
          />
        )}
        {section.kind === 'drinks' && section.display === 'table' && (
          <VolumeTable resolved={resolved} board={board} country={country} />
        )}
        {section.kind === 'chart' && (
          <ChartBlock resolved={resolved} board={board} country={country} />
        )}
      </div>
    </div>
  );
}

// ── Доска ─────────────────────────────────────────────────────────────────

export interface TvMenuBoardProps {
  board: TvBoardConfig;
  screen: ResolvedScreen | undefined;
  country: Country;
  loading?: boolean;
  error?: string | null;
  secondsUntilNextPoll?: number | null;
  flashMap?: Map<string, PriceTrend>;
  flashGen?: number;
  screenCount?: number;
  screenIndex?: number;
  className?: string;
}

const EMPTY_FLASH = new Map<string, PriceTrend>();

export default function TvMenuBoard({
  board,
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
    if (!board.header.showClock) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [board.header.showClock]);

  const sections = (screen?.sections ?? []).filter(sectionHasContent);
  const hasAny = sections.length > 0;

  // Доска занимает всю доступную ширину, поэтому один сантиметр экрана — это
  // ширина в пикселях, поделённая на физическую ширину телевизора.
  const pxPerCm =
    width / boardWidthCm(board.layout.screenDiagonalCm, board.layout.orientation);

  const rootStyle = {
    ...PALETTE[board.theme.background],
    '--tv-accent': board.theme.accent,
    '--tv-cm': `${pxPerCm}px`,
    '--tv-fs': String(board.layout.fontScale),
    color: 'var(--tv-text)',
  } as React.CSSProperties;

  const bgColor = board.theme.customBg ?? 'var(--tv-bg)';
  const pad = cm(board.layout.paddingCm);
  const hasBgImage = board.theme.bgImageUrl.trim().length > 0;

  const { header } = board;
  // Пустая шапка не должна занимать место: иначе сетка начинается не от угла.
  const showHeader =
    header.enabled &&
    (header.title.trim().length > 0 ||
      header.accentWord.trim().length > 0 ||
      header.subtitle.trim().length > 0 ||
      header.logoEmoji.trim().length > 0 ||
      header.showClock ||
      header.showCountry ||
      header.showRefreshBanner);

  return (
    <div
      ref={ref}
      className={cn('relative flex h-full flex-col overflow-hidden', className)}
      style={{ ...rootStyle, background: bgColor }}
    >
      {/* Фоновая картинка с затемнением — под всем содержимым */}
      {hasBgImage && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${board.theme.bgImageUrl})` }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: bgColor, opacity: board.theme.bgDim / 100 }}
          />
        </>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {showHeader && (
        <header
          className="flex shrink-0 flex-col"
          style={{
            paddingLeft: pad,
            paddingRight: pad,
            paddingTop: cm(1.15),
            paddingBottom: cm(0.96),
            gap: cm(0.96),
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-[1em]">
            <div className="flex min-w-0 items-center" style={{ gap: cm(1.34) }}>
              {board.header.logoEmoji && (
                <div
                  className="flex shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: 'color-mix(in srgb, var(--tv-accent) 15%, transparent)',
                    height: cm(4.03),
                    width: cm(4.03),
                    fontSize: cm(2.02),
                  }}
                >
                  {board.header.logoEmoji}
                </div>
              )}
              <div className="min-w-0">
                <h1
                  className="font-bold leading-none tracking-tight"
                  style={{ fontSize: cm(3.07) }}
                >
                  <span style={{ color: 'var(--tv-text)' }}>{board.header.title}</span>{' '}
                  <span style={{ color: 'var(--tv-accent)' }}>{board.header.accentWord}</span>
                </h1>
                {(board.header.subtitle.trim() ||
                  board.header.showCountry ||
                  (screenCount > 1 && screen?.title)) && (
                  <p
                    className="mt-1 truncate"
                    style={{ color: 'var(--tv-muted)', fontSize: cm(1.25) }}
                  >
                    {[
                      board.header.subtitle.trim(),
                      board.header.showCountry ? `${country.flag} ${country.name}` : '',
                      screenCount > 1 ? screen?.title ?? '' : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {board.header.showClock && (
              <div className="text-right tabular-nums">
                <div
                  className="font-semibold"
                  style={{ color: 'var(--tv-accent)', fontSize: cm(2.88) }}
                >
                  {now ? formatClock(now) : '--:--'}
                </div>
                <div
                  className="capitalize"
                  style={{ color: 'var(--tv-muted)', fontSize: cm(1.15) }}
                >
                  {now ? formatDate(now) : ''}
                </div>
              </div>
            )}
          </div>

          {board.header.showRefreshBanner && (
            <PriceRefreshBanner
              variant="tv"
              loading={loading}
              secondsUntilNextPoll={secondsUntilNextPoll}
            />
          )}
        </header>
        )}

        <main
          className="min-h-0 flex-1 overflow-hidden"
          style={{
            paddingLeft: pad,
            paddingRight: pad,
            paddingTop: showHeader ? 0 : pad,
            paddingBottom: pad,
          }}
        >
          {loading && !hasAny && (
            <div
              className="flex h-full items-center justify-center"
              style={{ color: 'var(--tv-muted)' }}
            >
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
            <div
              className="flex h-full items-center justify-center"
              style={{ color: 'var(--tv-muted)' }}
            >
              Пока нет позиций
            </div>
          )}

          {!error && hasAny && (
            <div
              className="grid h-full"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
                gap: cm(DENSITY_GAP[board.layout.density]),
              }}
            >
              {sections.map((resolved) => (
                <SectionBlock
                  key={resolved.section.id}
                  resolved={resolved}
                  board={board}
                  country={country}
                  flashMap={flashMap}
                  flashGen={flashGen}
                />
              ))}
            </div>
          )}
        </main>

        {board.ticker.enabled && board.ticker.text.trim() && (
          <div
            className="shrink-0 overflow-hidden border-t py-[0.5em]"
            style={{
              borderColor: 'var(--tv-border)',
              background: 'color-mix(in srgb, var(--tv-accent) 12%, var(--tv-surface))',
            }}
          >
            <div
              className="tv-ticker whitespace-nowrap font-medium"
              style={{
                color: 'var(--tv-text)',
                fontSize: cm(1.54),
                animationDuration: `${board.ticker.speedSec}s`,
              }}
            >
              {board.ticker.text}
            </div>
          </div>
        )}

        {(board.footer.trim() || screenCount > 1) && (
          <footer
            className="shrink-0 border-t py-[0.5em] text-center"
            style={{
              borderColor: 'var(--tv-border)',
              color: 'var(--tv-muted)',
              fontSize: cm(1.06),
            }}
          >
            <span>{board.footer}</span>
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
        )}
      </div>
    </div>
  );
}

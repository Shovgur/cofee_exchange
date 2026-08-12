/**
 * Модель конфигурации ТВ-меню.
 *
 * Позиции хранятся ссылками на напитки биржевой доски (`Drink.id`) и на
 * конкретные объёмы (`VolumePrice.value`). Цены в конфиге не сохраняются —
 * они всегда берутся живыми из /prices, конфиг задаёт только состав и вид.
 */

export const TV_MENU_CONFIG_VERSION = 1;

export type TvMenuDensity = 'compact' | 'normal' | 'spacious';
export type TvMenuBackground = 'dark' | 'light';

export interface TvMenuItemRef {
  drinkId: string;
  /** Пустой список — показывать все доступные объёмы напитка. */
  volumes: string[];
}

export interface TvMenuSection {
  id: string;
  title: string;
  /** Пусто — берётся общее число колонок из layout. */
  columns: number | null;
  items: TvMenuItemRef[];
}

export interface TvMenuScreen {
  id: string;
  title: string;
  sections: TvMenuSection[];
}

export interface TvMenuConfig {
  version: number;
  updatedAt: string;
  header: {
    title: string;
    accentWord: string;
    subtitle: string;
    logoEmoji: string;
    showClock: boolean;
    showRefreshBanner: boolean;
  };
  layout: {
    columns: number;
    density: TvMenuDensity;
    fontScale: number;
    showPhotos: boolean;
    showBeanPrices: boolean;
    showTrends: boolean;
  };
  theme: {
    accent: string;
    background: TvMenuBackground;
  };
  ticker: {
    enabled: boolean;
    text: string;
    speedSec: number;
  };
  rotation: {
    enabled: boolean;
    intervalSec: number;
  };
  screens: TvMenuScreen[];
  footer: string;
}

export const DEFAULT_ACCENT = '#E26402';

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptySection(title = 'Новая секция'): TvMenuSection {
  return { id: makeId('sec'), title, columns: null, items: [] };
}

export function emptyScreen(title = 'Новый экран'): TvMenuScreen {
  return { id: makeId('scr'), title, sections: [emptySection('Кофе')] };
}

export function defaultTvMenuConfig(): TvMenuConfig {
  return {
    version: TV_MENU_CONFIG_VERSION,
    updatedAt: new Date(0).toISOString(),
    header: {
      title: 'Coffee',
      accentWord: 'Exchange',
      subtitle: 'Меню',
      logoEmoji: '☕',
      showClock: true,
      showRefreshBanner: true,
    },
    layout: {
      columns: 3,
      density: 'normal',
      fontScale: 1,
      showPhotos: true,
      showBeanPrices: false,
      showTrends: false,
    },
    theme: { accent: DEFAULT_ACCENT, background: 'dark' },
    ticker: { enabled: false, text: '', speedSec: 30 },
    rotation: { enabled: false, intervalSec: 20 },
    screens: [],
    footer: 'Coffee Exchange · живые цены с биржи',
  };
}

// ── Нормализация ──────────────────────────────────────────────────────────
// Конфиг приходит из файла/сети и может быть частичным или устаревшим,
// поэтому каждое поле валидируется и заполняется дефолтом.

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function normalizeItem(raw: unknown): TvMenuItemRef | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const drinkId = typeof o.drinkId === 'string' ? o.drinkId : null;
  if (!drinkId) return null;
  const volumes = Array.isArray(o.volumes)
    ? o.volumes.filter((v): v is string => typeof v === 'string')
    : [];
  return { drinkId, volumes };
}

function normalizeSection(raw: unknown): TvMenuSection {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = Array.isArray(o.items)
    ? o.items.map(normalizeItem).filter((i): i is TvMenuItemRef => i !== null)
    : [];
  const columnsRaw = o.columns;
  return {
    id: str(o.id, makeId('sec')),
    title: str(o.title, 'Секция'),
    columns: columnsRaw == null ? null : num(columnsRaw, 3, 1, 6),
    items,
  };
}

function normalizeScreen(raw: unknown): TvMenuScreen {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const sections = Array.isArray(o.sections) ? o.sections.map(normalizeSection) : [];
  return {
    id: str(o.id, makeId('scr')),
    title: str(o.title, 'Экран'),
    sections,
  };
}

export function normalizeTvMenuConfig(raw: unknown): TvMenuConfig {
  const d = defaultTvMenuConfig();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, unknown>;

  const header = (o.header ?? {}) as Record<string, unknown>;
  const layout = (o.layout ?? {}) as Record<string, unknown>;
  const theme = (o.theme ?? {}) as Record<string, unknown>;
  const ticker = (o.ticker ?? {}) as Record<string, unknown>;
  const rotation = (o.rotation ?? {}) as Record<string, unknown>;

  const density = layout.density;
  const background = theme.background;

  return {
    version: TV_MENU_CONFIG_VERSION,
    updatedAt: str(o.updatedAt, d.updatedAt),
    header: {
      title: str(header.title, d.header.title),
      accentWord: str(header.accentWord, d.header.accentWord),
      subtitle: str(header.subtitle, d.header.subtitle),
      logoEmoji: str(header.logoEmoji, d.header.logoEmoji),
      showClock: bool(header.showClock, d.header.showClock),
      showRefreshBanner: bool(header.showRefreshBanner, d.header.showRefreshBanner),
    },
    layout: {
      columns: num(layout.columns, d.layout.columns, 1, 6),
      density:
        density === 'compact' || density === 'normal' || density === 'spacious'
          ? density
          : d.layout.density,
      fontScale: num(layout.fontScale, d.layout.fontScale, 0.7, 1.6),
      showPhotos: bool(layout.showPhotos, d.layout.showPhotos),
      showBeanPrices: bool(layout.showBeanPrices, d.layout.showBeanPrices),
      showTrends: bool(layout.showTrends, d.layout.showTrends),
    },
    theme: {
      accent: isHexColor(theme.accent) ? theme.accent : d.theme.accent,
      background: background === 'light' ? 'light' : 'dark',
    },
    ticker: {
      enabled: bool(ticker.enabled, d.ticker.enabled),
      text: str(ticker.text, d.ticker.text),
      speedSec: num(ticker.speedSec, d.ticker.speedSec, 5, 180),
    },
    rotation: {
      enabled: bool(rotation.enabled, d.rotation.enabled),
      intervalSec: num(rotation.intervalSec, d.rotation.intervalSec, 5, 600),
    },
    screens: Array.isArray(o.screens) ? o.screens.map(normalizeScreen) : d.screens,
    footer: str(o.footer, d.footer),
  };
}

/** Конфиг без экранов означает «показывать всю доску» — режим по умолчанию. */
export function isAutoBoard(config: TvMenuConfig): boolean {
  return config.screens.length === 0;
}

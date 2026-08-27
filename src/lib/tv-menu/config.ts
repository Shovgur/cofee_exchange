/**
 * Модель конфигурации ТВ-меню (версия 3).
 *
 * Документ хранит несколько независимых досок. Каждая доска — это отдельная
 * ссылка для телевизора со своим оформлением, бегущей строкой и экранами,
 * поэтому настройки одной доски не влияют на другие.
 *
 * Позиции хранятся ссылками на напитки биржевой доски (`Drink.id`) и на
 * конкретные объёмы (`VolumePrice.value`). Цены в конфиге не сохраняются —
 * они всегда берутся живыми из /prices, конфиг задаёт только состав и вид.
 */

export const TV_MENU_CONFIG_VERSION = 3;

/**
 * Сетка экрана: секции размещаются в этих условных единицах. Шаг мелкий,
 * чтобы блоки можно было ставить точно, без крупных пустот по краям.
 */
export const GRID_COLUMNS = 24;
export const GRID_ROWS = 24;

/** Диагональ по умолчанию для новой доски. */
export const REFERENCE_DIAGONAL_CM = 110;

export type TvOrientation = 'landscape' | 'portrait';

/**
 * Доска рисуется в пропорции 16:9 (или 9:16 для вертикального телевизора),
 * поэтому из диагонали однозначно получаются физические размеры экрана.
 */
const LONG_SIDE = 16 / Math.hypot(16, 9);
const SHORT_SIDE = 9 / Math.hypot(16, 9);

export function boardWidthCm(
  diagonalCm: number,
  orientation: TvOrientation = 'landscape',
): number {
  return diagonalCm * (orientation === 'portrait' ? SHORT_SIDE : LONG_SIDE);
}

export function boardHeightCm(
  diagonalCm: number,
  orientation: TvOrientation = 'landscape',
): number {
  return diagonalCm * (orientation === 'portrait' ? LONG_SIDE : SHORT_SIDE);
}

export type TvMenuDensity = 'compact' | 'normal' | 'spacious';
export type TvMenuBackground = 'dark' | 'light';
export type TvSectionKind = 'drinks' | 'media' | 'text' | 'chart';
export type TvDrinksDisplay = 'cards' | 'list' | 'table';
export type TvMediaFit = 'cover' | 'contain';

export interface TvMenuItemRef {
  drinkId: string;
  /** Пустой список — показывать все доступные объёмы напитка. */
  volumes: string[];
}

/** Позиция и размер секции в сетке экрана. */
export interface TvGridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TvMenuSection {
  id: string;
  kind: TvSectionKind;
  title: string;
  rect: TvGridRect;
  /** Своя заливка секции; null — цвет поверхности темы. */
  background: string | null;
  showFrame: boolean;

  // kind: 'drinks'
  display: TvDrinksDisplay;
  /** Колонок внутри секции для режима карточек; null — авто. */
  columns: number | null;
  items: TvMenuItemRef[];

  // kind: 'chart' — график одного конкретного объёма одного напитка
  chartDrinkId: string;
  /** `VolumePrice.value`; пусто — первый доступный объём напитка. */
  chartVolume: string;

  // kind: 'media'
  mediaUrl: string;
  mediaType: 'image' | 'video';
  mediaFit: TvMediaFit;

  // kind: 'text'
  text: string;
}

export interface TvMenuScreen {
  id: string;
  title: string;
  sections: TvMenuSection[];
}

export interface TvBoardConfig {
  id: string;
  /** Название для админки; в URL используется id. */
  name: string;
  header: {
    /** Выключенная шапка освобождает верх экрана — меню начинается от угла. */
    enabled: boolean;
    title: string;
    accentWord: string;
    subtitle: string;
    logoEmoji: string;
    showClock: boolean;
    showCountry: boolean;
    showRefreshBanner: boolean;
  };
  layout: {
    orientation: TvOrientation;
    density: TvMenuDensity;
    fontScale: number;
    /** Диагональ телевизора в сантиметрах — задаёт размер рабочей области. */
    screenDiagonalCm: number;
    /** Поля по краям экрана в сантиметрах; 0 — вплотную к углам. */
    paddingCm: number;
    showPhotos: boolean;
    showBeanPrices: boolean;
    showTrends: boolean;
    showPercent: boolean;
  };
  theme: {
    accent: string;
    background: TvMenuBackground;
    /** Свой цвет фона поверх пресета; null — цвет темы. */
    customBg: string | null;
    bgImageUrl: string;
    /** Затемнение фоновой картинки, 0–90 %. */
    bgDim: number;
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

export interface TvMenuDocument {
  version: number;
  updatedAt: string;
  boards: TvBoardConfig[];
}

export const DEFAULT_ACCENT = '#E26402';

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Конструкторы ──────────────────────────────────────────────────────────

export function emptySection(
  title = 'Новая секция',
  rect: TvGridRect = { x: 0, y: 0, w: GRID_COLUMNS, h: Math.round(GRID_ROWS / 3) },
  kind: TvSectionKind = 'drinks',
): TvMenuSection {
  return {
    id: makeId('sec'),
    kind,
    title,
    rect,
    background: null,
    showFrame: true,
    display: 'cards',
    columns: null,
    items: [],
    chartDrinkId: '',
    chartVolume: '',
    mediaUrl: '',
    mediaType: 'image',
    mediaFit: 'cover',
    text: '',
  };
}

export function emptyScreen(title = 'Новый экран'): TvMenuScreen {
  return { id: makeId('scr'), title, sections: [] };
}

export function defaultBoard(name = 'Основное меню'): TvBoardConfig {
  return {
    id: makeId('board'),
    name,
    header: {
      enabled: true,
      title: 'Coffee',
      accentWord: 'Exchange',
      subtitle: 'Меню',
      logoEmoji: '☕',
      showClock: true,
      showCountry: false,
      showRefreshBanner: false,
    },
    layout: {
      orientation: 'landscape',
      density: 'compact',
      fontScale: 1,
      screenDiagonalCm: REFERENCE_DIAGONAL_CM,
      paddingCm: 1,
      showPhotos: true,
      showBeanPrices: false,
      showTrends: false,
      showPercent: false,
    },
    theme: {
      accent: DEFAULT_ACCENT,
      background: 'dark',
      customBg: null,
      bgImageUrl: '',
      bgDim: 40,
    },
    ticker: { enabled: false, text: '', speedSec: 30 },
    rotation: { enabled: false, intervalSec: 20 },
    screens: [],
    footer: '',
  };
}

export function defaultTvMenuDocument(): TvMenuDocument {
  return {
    version: TV_MENU_CONFIG_VERSION,
    updatedAt: new Date(0).toISOString(),
    boards: [defaultBoard()],
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

function normalizeRect(raw: unknown, fallbackY: number, gridScale = 1): TvGridRect {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const scale = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value * gridScale : value;

  const x = num(scale(o.x), 0, 0, GRID_COLUMNS - 1);
  const y = num(scale(o.y), fallbackY, 0, GRID_ROWS - 1);
  // Размер ограничиваем остатком сетки, иначе секция вылезет за пределы экрана.
  return {
    x,
    y,
    w: num(scale(o.w), GRID_COLUMNS - x, 1, GRID_COLUMNS - x),
    h: num(scale(o.h), Math.min(GRID_ROWS / 3, GRID_ROWS - y), 1, GRID_ROWS - y),
  };
}

function normalizeSection(
  raw: unknown,
  index: number,
  gridScale: number,
): TvMenuSection {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base = emptySection('Секция');

  const kind = o.kind;
  const display = o.display;
  const mediaType = o.mediaType;
  const mediaFit = o.mediaFit;
  const columnsRaw = o.columns;
  const rowStep = Math.round(GRID_ROWS / 3);

  return {
    id: str(o.id, makeId('sec')),
    kind:
      kind === 'media' || kind === 'text' || kind === 'chart' ? kind : 'drinks',
    title: str(o.title, base.title),
    rect: normalizeRect(o.rect, Math.min(GRID_ROWS - 1, index * rowStep), gridScale),
    background: isHexColor(o.background) ? o.background : null,
    showFrame: bool(o.showFrame, base.showFrame),
    display:
      display === 'list' || display === 'table' || display === 'cards' ? display : 'cards',
    columns: columnsRaw == null ? null : num(columnsRaw, 2, 1, 6),
    items: Array.isArray(o.items)
      ? o.items.map(normalizeItem).filter((i): i is TvMenuItemRef => i !== null)
      : [],
    chartDrinkId: str(o.chartDrinkId, ''),
    chartVolume: str(o.chartVolume, ''),
    mediaUrl: str(o.mediaUrl, ''),
    mediaType: mediaType === 'video' ? 'video' : 'image',
    mediaFit: mediaFit === 'contain' ? 'contain' : 'cover',
    text: str(o.text, ''),
  };
}

function normalizeScreen(raw: unknown, gridScale: number): TvMenuScreen {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: str(o.id, makeId('scr')),
    title: str(o.title, 'Экран'),
    sections: Array.isArray(o.sections)
      ? o.sections.map((s, i) => normalizeSection(s, i, gridScale))
      : [],
  };
}

/**
 * @param gridScale множитель координат сетки при переходе на более мелкий шаг
 *   (конфиги v2 хранили раскладку в сетке 12×12).
 */
export function normalizeBoard(raw: unknown, gridScale = 1): TvBoardConfig {
  const d = defaultBoard();
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const header = (o.header ?? {}) as Record<string, unknown>;
  const layout = (o.layout ?? {}) as Record<string, unknown>;
  const theme = (o.theme ?? {}) as Record<string, unknown>;
  const ticker = (o.ticker ?? {}) as Record<string, unknown>;
  const rotation = (o.rotation ?? {}) as Record<string, unknown>;

  const density = layout.density;

  return {
    id: str(o.id, d.id),
    name: str(o.name, d.name),
    header: {
      enabled: bool(header.enabled, d.header.enabled),
      title: str(header.title, d.header.title),
      accentWord: str(header.accentWord, d.header.accentWord),
      subtitle: str(header.subtitle, d.header.subtitle),
      logoEmoji: str(header.logoEmoji, d.header.logoEmoji),
      showClock: bool(header.showClock, d.header.showClock),
      showCountry: bool(header.showCountry, d.header.showCountry),
      showRefreshBanner: bool(header.showRefreshBanner, d.header.showRefreshBanner),
    },
    layout: {
      orientation: layout.orientation === 'portrait' ? 'portrait' : 'landscape',
      density:
        density === 'compact' || density === 'normal' || density === 'spacious'
          ? density
          : d.layout.density,
      fontScale: num(layout.fontScale, d.layout.fontScale, 0.4, 2),
      screenDiagonalCm: num(
        layout.screenDiagonalCm,
        d.layout.screenDiagonalCm,
        40,
        400,
      ),
      paddingCm: num(layout.paddingCm, d.layout.paddingCm, 0, 6),
      showPhotos: bool(layout.showPhotos, d.layout.showPhotos),
      showBeanPrices: bool(layout.showBeanPrices, d.layout.showBeanPrices),
      showTrends: bool(layout.showTrends, d.layout.showTrends),
      showPercent: bool(layout.showPercent, d.layout.showPercent),
    },
    theme: {
      accent: isHexColor(theme.accent) ? theme.accent : d.theme.accent,
      background: theme.background === 'light' ? 'light' : 'dark',
      customBg: isHexColor(theme.customBg) ? theme.customBg : null,
      bgImageUrl: str(theme.bgImageUrl, ''),
      bgDim: num(theme.bgDim, d.theme.bgDim, 0, 90),
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
    screens: Array.isArray(o.screens)
      ? o.screens.map((s) => normalizeScreen(s, gridScale))
      : [],
    footer: str(o.footer, d.footer),
  };
}

/** Конфиг версии 1 был одной доской без сетки — разворачиваем его в документ. */
function migrateV1(raw: Record<string, unknown>): TvMenuDocument {
  const legacyColumns = num(
    (raw.layout as Record<string, unknown> | undefined)?.columns,
    3,
    1,
    6,
  );

  const board = normalizeBoard({ ...raw, name: 'Основное меню' });

  board.screens = board.screens.map((screen) => {
    let y = 0;
    return {
      ...screen,
      sections: screen.sections.map((section) => {
        const rows = Math.ceil(section.items.length / legacyColumns) * 4 + 2;
        const h = Math.max(4, Math.min(GRID_ROWS - y, rows));
        const rect: TvGridRect = { x: 0, y, w: GRID_COLUMNS, h };
        y = Math.min(GRID_ROWS - 1, y + h);
        return { ...section, columns: legacyColumns, rect };
      }),
    };
  });

  return {
    version: TV_MENU_CONFIG_VERSION,
    updatedAt: str(raw.updatedAt, new Date(0).toISOString()),
    boards: [board],
  };
}

export function normalizeTvMenuDocument(raw: unknown): TvMenuDocument {
  const d = defaultTvMenuDocument();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, unknown>;

  if (!Array.isArray(o.boards)) {
    // Либо старый формат v1, либо мусор — в обоих случаях миграция даст
    // корректный документ с одной доской.
    return migrateV1(o);
  }

  // v2 хранил раскладку в сетке 12×12: координаты растягиваем под новый шаг,
  // чтобы уже собранные экраны выглядели так же.
  const version = num(o.version, TV_MENU_CONFIG_VERSION, 1, 99);
  const gridScale = version < 3 ? GRID_COLUMNS / 12 : 1;

  const boards = o.boards.map((b) => normalizeBoard(b, gridScale));
  return {
    version: TV_MENU_CONFIG_VERSION,
    updatedAt: str(o.updatedAt, d.updatedAt),
    boards: boards.length > 0 ? boards : d.boards,
  };
}

export function findBoard(
  doc: TvMenuDocument,
  boardId: string | undefined,
): TvBoardConfig | undefined {
  if (!boardId) return doc.boards[0];
  return doc.boards.find((b) => b.id === boardId);
}

/** Доска без экранов показывает всю биржевую доску, разбитую по категориям. */
export function isAutoBoard(board: TvBoardConfig): boolean {
  return board.screens.length === 0;
}

import type { Drink, DrinkCategory, VolumePrice } from '@/types';
import {
  emptySection,
  isAutoBoard,
  GRID_COLUMNS,
  GRID_ROWS,
  type TvBoardConfig,
  type TvMenuSection,
} from '@/lib/tv-menu/config';

export const CATEGORY_ORDER: DrinkCategory[] = ['coffee', 'tea', 'lemonade'];

export const CATEGORY_TITLE: Record<DrinkCategory, string> = {
  coffee: 'Кофе',
  tea: 'Чай',
  lemonade: 'Лимонады',
};

export const CATEGORY_EMOJI: Record<DrinkCategory, string> = {
  coffee: '☕',
  tea: '🍵',
  lemonade: '🍋',
};

export interface ResolvedItem {
  drink: Drink;
  /** Объёмы после фильтра из конфига; всегда непустой. */
  volumes: VolumePrice[];
}

export interface ResolvedSection {
  section: TvMenuSection;
  items: ResolvedItem[];
  /** Заполняется только для секции-графика. */
  chart: { drink: Drink; volume: VolumePrice } | null;
}

export interface ResolvedScreen {
  id: string;
  title: string;
  sections: ResolvedSection[];
}

/** Объёмы, встречающиеся в секции — заголовки колонок для табличного режима. */
export function sectionVolumeColumns(items: ResolvedItem[]): string[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    for (const v of item.volumes) {
      if (!seen.has(v.label)) seen.set(v.label, parseFloat(v.value) || 0);
    }
  }
  return Array.from(seen.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
}

function autoScreens(drinks: Drink[]): ResolvedScreen[] {
  const sections: ResolvedSection[] = [];
  let y = 0;

  for (const category of CATEGORY_ORDER) {
    const items = drinks
      .filter((d) => d.category === category)
      .map((drink) => ({ drink, volumes: drink.volumes }));
    if (items.length === 0) continue;

    const rows = Math.ceil(items.length / 3) * 4 + 2;
    const h = Math.max(4, Math.min(GRID_ROWS - y, rows));
    const section = emptySection(CATEGORY_TITLE[category], {
      x: 0,
      y,
      w: GRID_COLUMNS,
      h,
    });
    section.id = `auto-${category}`;
    section.columns = 3;
    y = Math.min(GRID_ROWS - 1, y + h);

    sections.push({ section, items, chart: null });
  }

  return [{ id: 'auto', title: 'Вся доска', sections }];
}

/**
 * Разворачивает доску в готовые к отрисовке экраны, подставляя актуальные
 * цены. Позиции, которых уже нет на бирже, молча пропускаются — так меню не
 * ломается, если напиток убрали из продажи.
 */
export function resolveScreens(
  board: TvBoardConfig,
  drinks: Drink[],
): ResolvedScreen[] {
  if (isAutoBoard(board)) return autoScreens(drinks);

  const byId = new Map(drinks.map((d) => [d.id, d]));

  return board.screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    sections: screen.sections.map((section) => {
      if (section.kind === 'chart') {
        const drink = byId.get(section.chartDrinkId);
        const volume = drink
          ? (drink.volumes.find((v) => v.value === section.chartVolume) ??
            drink.volumes[0])
          : undefined;
        return {
          section,
          items: [],
          chart: drink && volume ? { drink, volume } : null,
        };
      }

      if (section.kind !== 'drinks') return { section, items: [], chart: null };

      const items: ResolvedItem[] = [];
      for (const ref of section.items) {
        const drink = byId.get(ref.drinkId);
        if (!drink) continue;
        const volumes = ref.volumes.length
          ? drink.volumes.filter((v) => ref.volumes.includes(v.value))
          : drink.volumes;
        if (volumes.length === 0) continue;
        items.push({ drink, volumes });
      }
      return { section, items, chart: null };
    }),
  }));
}

/** Секция считается пустой, только если в ней нечего показать. */
export function sectionHasContent(resolved: ResolvedSection): boolean {
  const { section } = resolved;
  if (section.kind === 'media') return section.mediaUrl.trim().length > 0;
  if (section.kind === 'text') return section.text.trim().length > 0 || !!section.title.trim();
  if (section.kind === 'chart') return resolved.chart !== null;
  return resolved.items.length > 0;
}

export function screenHasContent(screen: ResolvedScreen | undefined): boolean {
  return !!screen && screen.sections.some(sectionHasContent);
}

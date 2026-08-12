import type { Drink, DrinkCategory, VolumePrice } from '@/types';
import { isAutoBoard, type TvMenuConfig } from '@/lib/tv-menu/config';

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
  id: string;
  title: string;
  columns: number | null;
  items: ResolvedItem[];
}

export interface ResolvedScreen {
  id: string;
  title: string;
  sections: ResolvedSection[];
}

function autoScreens(drinks: Drink[]): ResolvedScreen[] {
  const sections: ResolvedSection[] = [];
  for (const category of CATEGORY_ORDER) {
    const items = drinks
      .filter((d) => d.category === category)
      .map((drink) => ({ drink, volumes: drink.volumes }));
    if (items.length === 0) continue;
    sections.push({
      id: `auto-${category}`,
      title: CATEGORY_TITLE[category],
      columns: null,
      items,
    });
  }
  return [{ id: 'auto', title: 'Вся доска', sections }];
}

/**
 * Разворачивает конфиг в готовые к отрисовке экраны, подставляя актуальные
 * цены. Позиции, которых уже нет на доске, молча пропускаются — так меню не
 * ломается, если напиток убрали из продажи.
 */
export function resolveScreens(
  config: TvMenuConfig,
  drinks: Drink[],
): ResolvedScreen[] {
  if (isAutoBoard(config)) return autoScreens(drinks);

  const byId = new Map(drinks.map((d) => [d.id, d]));

  return config.screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    sections: screen.sections.map((section) => {
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
      return {
        id: section.id,
        title: section.title,
        columns: section.columns,
        items,
      };
    }),
  }));
}

export function screenHasContent(screen: ResolvedScreen | undefined): boolean {
  return !!screen && screen.sections.some((s) => s.items.length > 0);
}

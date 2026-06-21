import { parsePrice } from '@/lib/api/exchange/client';
import type { ApiMenuModifier } from '@/lib/api/loyalty/types';

export type DrinkAddonGroupType = 'single' | 'multi';

export interface DrinkAddonNutrition {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

export interface DrinkAddonOption {
  id: string;
  name: string;
  priceRub: number;
  priceBeans: number;
  nutrition?: DrinkAddonNutrition;
}

export interface DrinkAddonGroup {
  id: string;
  title: string;
  type: DrinkAddonGroupType;
  options: DrinkAddonOption[];
}

/** Модификаторы с API → группы для UI */
export function mapApiModifiersToGroups(
  modifiers: ApiMenuModifier[],
): DrinkAddonGroup[] {
  if (modifiers.length === 0) return [];

  return [
    {
      id: 'modifiers',
      title: 'Добавки',
      type: 'multi',
      options: modifiers.map((m) => ({
        id: m.id,
        name: m.name,
        priceRub: parsePrice(m.base_price),
        priceBeans: m.price_beans ?? 0,
      })),
    },
  ];
}

export function defaultSingleSelection(
  groups: DrinkAddonGroup[],
): Record<string, string> {
  const m: Record<string, string> = {};
  for (const g of groups) {
    if (g.type !== 'single') continue;
    const free = g.options.find((o) => o.priceRub === 0 && o.priceBeans === 0);
    m[g.id] = (free ?? g.options[0])?.id ?? '';
  }
  return m;
}

export function defaultMultiSelection(groups: DrinkAddonGroup[]): Set<string> {
  const s = new Set<string>();
  for (const g of groups) {
    if (g.type !== 'multi') continue;
    for (const o of g.options) {
      if (o.priceRub === 0 && o.priceBeans === 0) s.add(o.id);
    }
  }
  return s;
}

export function collectModifierIds(
  groups: DrinkAddonGroup[],
  singleSel: Record<string, string>,
  multiSel: Set<string>,
): string[] {
  const ids: string[] = [];
  for (const g of groups) {
    if (g.type === 'single') {
      const id = singleSel[g.id];
      if (id) ids.push(id);
    } else {
      for (const o of g.options) {
        if (multiSel.has(o.id)) ids.push(o.id);
      }
    }
  }
  return ids;
}

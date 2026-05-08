/**
 * Мок-данные допов к напитку. Цены в ₽ и в бинах — демо.
 */

export type DrinkAddonGroupType = 'single' | 'multi';

export interface DrinkAddonOption {
  id: string;
  name: string;
  priceRub: number;
  priceBeans: number;
}

export interface DrinkAddonGroup {
  id: string;
  title: string;
  type: DrinkAddonGroupType;
  options: DrinkAddonOption[];
}

export const DRINK_ADDON_GROUPS: DrinkAddonGroup[] = [
  {
    id: 'milk',
    title: 'Молоко',
    type: 'single',
    options: [
      { id: 'm-regular', name: 'Обычное', priceRub: 0, priceBeans: 0 },
      { id: 'm-oat', name: 'Овсяное', priceRub: 15, priceBeans: 3 },
      { id: 'm-coconut', name: 'Кокосовое', priceRub: 20, priceBeans: 4 },
    ],
  },
  {
    id: 'syrup',
    title: 'Сироп',
    type: 'single',
    options: [
      { id: 's-none', name: 'Без сиропа', priceRub: 0, priceBeans: 0 },
      { id: 's-vanilla', name: 'Ваниль', priceRub: 25, priceBeans: 5 },
      { id: 's-caramel', name: 'Карамель', priceRub: 25, priceBeans: 5 },
      { id: 's-hazelnut', name: 'Лесной орех', priceRub: 30, priceBeans: 6 },
    ],
  },
  {
    id: 'extras',
    title: 'Добавки',
    type: 'multi',
    options: [
      { id: 'e-cinnamon', name: 'Корица', priceRub: 0, priceBeans: 0 },
      { id: 'e-choco', name: 'Шоколадная крошка', priceRub: 30, priceBeans: 6 },
      { id: 'e-cream', name: 'Взбитые сливки', priceRub: 40, priceBeans: 8 },
      { id: 'e-marsh', name: 'Маршмеллоу', priceRub: 35, priceBeans: 7 },
    ],
  },
];

/** Одно моковое число бинов за напиток от рублёвой цены объёма */
export function mockBeansForDrinkPrice(priceRub: number): number {
  return Math.max(28, Math.round(priceRub * 0.19));
}

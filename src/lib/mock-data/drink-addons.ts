/**
 * Мок-данные допов к напитку. Цены в ₽ и в бинах — демо.
 */

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
  /** Дельта к базовым КБЖУ порции при выборе опции */
  nutrition?: DrinkAddonNutrition;
}

export interface DrinkAddonGroup {
  id: string;
  title: string;
  type: DrinkAddonGroupType;
  options: DrinkAddonOption[];
}

export const DRINK_ADDON_GROUPS: DrinkAddonGroup[] = [
  {
    id: 'temperature',
    title: 'Температура',
    type: 'single',
    options: [
      { id: 't-hot', name: 'Горячий', priceRub: 0, priceBeans: 0 },
      { id: 't-cold', name: 'Холодный', priceRub: 0, priceBeans: 0 },
    ],
  },
  {
    id: 'milk',
    title: 'Молоко',
    type: 'single',
    options: [
      { id: 'm-regular', name: 'Обычное', priceRub: 0, priceBeans: 0 },
      {
        id: 'm-oat',
        name: 'Овсяное',
        priceRub: 15,
        priceBeans: 3,
        nutrition: { calories: 18, proteins: 0.4, fats: 0.8, carbs: 2.2 },
      },
      {
        id: 'm-coconut',
        name: 'Кокосовое',
        priceRub: 20,
        priceBeans: 4,
        nutrition: { calories: 24, proteins: 0.2, fats: 2.1, carbs: 1.4 },
      },
    ],
  },
  {
    id: 'syrup',
    title: 'Сиропы',
    type: 'multi',
    options: [
      {
        id: 's-vanilla',
        name: 'Ваниль',
        priceRub: 25,
        priceBeans: 5,
        nutrition: { calories: 35, proteins: 0, fats: 0, carbs: 8.5 },
      },
      {
        id: 's-caramel',
        name: 'Карамель',
        priceRub: 25,
        priceBeans: 5,
        nutrition: { calories: 38, proteins: 0.1, fats: 0.2, carbs: 9 },
      },
      {
        id: 's-hazelnut',
        name: 'Лесной орех',
        priceRub: 30,
        priceBeans: 6,
        nutrition: { calories: 36, proteins: 0.3, fats: 0.6, carbs: 8 },
      },
    ],
  },
  {
    id: 'extras',
    title: 'Добавки',
    type: 'multi',
    options: [
      { id: 'e-cinnamon', name: 'Корица', priceRub: 0, priceBeans: 0, nutrition: { calories: 2, proteins: 0, fats: 0, carbs: 0.6 } },
      {
        id: 'e-choco',
        name: 'Шоколадная крошка',
        priceRub: 30,
        priceBeans: 6,
        nutrition: { calories: 45, proteins: 0.8, fats: 2.2, carbs: 6 },
      },
      {
        id: 'e-cream',
        name: 'Взбитые сливки',
        priceRub: 40,
        priceBeans: 8,
        nutrition: { calories: 52, proteins: 0.4, fats: 4.5, carbs: 3 },
      },
      {
        id: 'e-marsh',
        name: 'Маршмеллоу',
        priceRub: 35,
        priceBeans: 7,
        nutrition: { calories: 28, proteins: 0.2, fats: 0, carbs: 7 },
      },
    ],
  },
];

/** Одно моковое число бинов за напиток от рублёвой цены объёма */
export function mockBeansForDrinkPrice(priceRub: number): number {
  return Math.max(28, Math.round(priceRub * 0.19));
}

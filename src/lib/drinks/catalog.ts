import type { DrinkCategory, PriceTrend, PricePoint } from '@/types';

// ─── Price history generation (used for chart display) ────────────────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Генерирует псевдо-историческую кривую цены для графика.
 * Используется в menu-from-api.ts, т.к. API не отдаёт историю.
 */
export function generatePriceHistory(basePrice: number, seed: number): PricePoint[] {
  const rand = seededRand(seed);
  const now = Date.now();
  const points: PricePoint[] = [];
  let price = basePrice;

  for (let i = 95; i >= 0; i--) {
    const timestamp = now - i * 30 * 60 * 1000;
    const change = (rand() - 0.5) * price * 0.04;
    price = Math.max(basePrice * 0.7, Math.min(basePrice * 1.35, price + change));
    points.push({ timestamp, price: Math.round(price * 100) / 100 });
  }

  return points;
}

export function computeTrend(change: number): PriceTrend {
  if (change > 0.5) return 'up';
  if (change < -0.5) return 'down';
  return 'neutral';
}

// ─── Drink templates (static metadata: photo, description, category) ─────────
// Цены больше не хранятся здесь — они приходят с бэкенда через /api/v1/prices.

export interface DrinkTemplate {
  id: string;
  name: string;
  nameShort: string;
  category: DrinkCategory;
  volume: string;
  description: string;
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
  photoUrl: string;
}

export const DRINK_TEMPLATES: DrinkTemplate[] = [
  {
    id: 'espresso',
    name: 'Эспрессо',
    nameShort: 'Эспрессо',
    category: 'coffee',
    volume: '30 мл',
    description: 'Классический эспрессо из зерна арабики высшего сорта. Насыщенный вкус с карамельным послевкусием.',
    calories: 5,
    proteins: 0.3,
    fats: 0.1,
    carbs: 0.8,
    photoUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80',
  },
  {
    id: 'americano',
    name: 'Американо',
    nameShort: 'Американо',
    category: 'coffee',
    volume: '200 мл',
    description: 'Эспрессо, разбавленный горячей водой. Мягкий и сбалансированный кофе на каждый день.',
    calories: 10,
    proteins: 0.5,
    fats: 0.2,
    carbs: 1.2,
    photoUrl: 'https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=400&q=80',
  },
  {
    id: 'cappuccino',
    name: 'Капучино',
    nameShort: 'Капучино',
    category: 'coffee',
    volume: '250 мл',
    description: 'Двойной эспрессо с бархатистой молочной пеной. Идеальный баланс кофе и молока.',
    calories: 120,
    proteins: 6.0,
    fats: 4.5,
    carbs: 10.0,
    photoUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80',
  },
  {
    id: 'latte',
    name: 'Латте',
    nameShort: 'Латте',
    category: 'coffee',
    volume: '350 мл',
    description: 'Нежный эспрессо с большим количеством парного молока. Мягкий кофейный вкус.',
    calories: 150,
    proteins: 7.5,
    fats: 5.5,
    carbs: 13.0,
    photoUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&q=80',
  },
  {
    id: 'flat-white',
    name: 'Флэт Уайт',
    nameShort: 'Флэт Уайт',
    category: 'coffee',
    volume: '180 мл',
    description: 'Двойной ристретто с микропеной из свежего молока. Концентрированный и бархатистый.',
    calories: 90,
    proteins: 5.0,
    fats: 3.5,
    carbs: 8.0,
    photoUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80',
  },
  {
    id: 'lemonade-classic',
    name: 'Лимонад классический',
    nameShort: 'Лимонад',
    category: 'lemonade',
    volume: '400 мл',
    description: 'Освежающий лимонад из свежевыжатого лимона с мятой и газированной водой.',
    calories: 80,
    proteins: 0.3,
    fats: 0.1,
    carbs: 20.0,
    photoUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
  },
  {
    id: 'lemonade-mango',
    name: 'Лимонад манго-маракуйя',
    nameShort: 'Манго-маракуйя',
    category: 'lemonade',
    volume: '400 мл',
    description: 'Тропический лимонад с натуральным пюре манго и соком маракуйи.',
    calories: 110,
    proteins: 0.5,
    fats: 0.2,
    carbs: 26.0,
    photoUrl: 'https://images.unsplash.com/photo-1554306274-f23873d9a26c?w=400&q=80',
  },
  {
    id: 'lemonade-matcha',
    name: 'Матча Лимонад',
    nameShort: 'Матча',
    category: 'lemonade',
    volume: '400 мл',
    description: 'Японский чай матча с лимоном и газированной водой. Бодрящий и необычный.',
    calories: 60,
    proteins: 1.0,
    fats: 0.3,
    carbs: 14.0,
    photoUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  },
  {
    id: 'tea-black',
    name: 'Чай чёрный авторский',
    nameShort: 'Чёрный чай',
    category: 'tea',
    volume: '300 мл',
    description: 'Купаж цейлонских и индийских чаёв. Крепкий, насыщенный, с тонким ароматом.',
    calories: 5,
    proteins: 0.1,
    fats: 0.0,
    carbs: 0.5,
    photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'tea-green',
    name: 'Зелёный чай с жасмином',
    nameShort: 'Зелёный жасмин',
    category: 'tea',
    volume: '300 мл',
    description: 'Нежный зелёный чай с настоящими цветами жасмина. Освежающий и ароматный.',
    calories: 3,
    proteins: 0.1,
    fats: 0.0,
    carbs: 0.4,
    photoUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80',
  },
];

// ─── Name matching utilities (used by menu-from-api.ts and drink-category-from-api.ts) ─

/** Lowercase, ё→е, trim — для сравнения имён с бэка и шаблонов. */
export function normalizeDrinkName(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeDrinkName(name: string): string[] {
  return normalizeDrinkName(name)
    .split(/[^a-zа-я0-9]+/i)
    .filter((w) => w.length >= 2);
}

/**
 * Найти шаблон по имени из API.
 * Бэк может отдавать «Чай зелёный», а в шаблонах — «Зелёный чай с жасмином»;
 * точного совпадения нет → нормализация и совпадение по токенам.
 */
export function findTemplateByName(name: string): DrinkTemplate | undefined {
  if (!name.trim()) return undefined;

  const norm = normalizeDrinkName(name);

  // 1. Точное совпадение после нормализации
  const exact = DRINK_TEMPLATES.find((t) => normalizeDrinkName(t.name) === norm);
  if (exact) return exact;

  // 2. Шаблон содержит API-имя (API — короткий алиас шаблона).
  //    Обратное направление не используем: «Айс латте» содержит «Латте» — другой напиток.
  const bySubstring = DRINK_TEMPLATES.find((t) => normalizeDrinkName(t.name).includes(norm));
  if (bySubstring) return bySubstring;

  // 3. Все значимые слова из API присутствуют в названии шаблона
  const apiTokens = tokenizeDrinkName(name);
  if (apiTokens.length === 0) return undefined;

  let best: DrinkTemplate | undefined;
  let bestHits = -1;
  for (const t of DRINK_TEMPLATES) {
    const tNorm = normalizeDrinkName(t.name);
    const hits = apiTokens.filter((tok) => tNorm.includes(tok)).length;
    if (hits > bestHits) { bestHits = hits; best = t; }
  }
  if (best && bestHits === apiTokens.length) return best;

  return undefined;
}

/** Найти шаблон по его статическому id (например 'espresso'). */
export function findTemplateById(id: string): DrinkTemplate | undefined {
  return DRINK_TEMPLATES.find((t) => t.id === id);
}

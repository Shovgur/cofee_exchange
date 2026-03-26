import type { Drink, DrinkCategory, PriceTrend, PricePoint } from '@/types';

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generatePriceHistory(basePrice: number, seed: number): PricePoint[] {
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

function computeTrend(change: number): PriceTrend {
  if (change > 0.5) return 'up';
  if (change < -0.5) return 'down';
  return 'neutral';
}

interface DrinkTemplate {
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
}

const DRINK_TEMPLATES: DrinkTemplate[] = [
  {
    id: 'espresso',
    name: 'Эспрессо',
    nameShort: 'Эспрессо',
    category: 'coffee',
    volume: '30 мл',
    description:
      'Классический эспрессо из зерна арабики высшего сорта. Насыщенный вкус с карамельным послевкусием.',
    calories: 5,
    proteins: 0.3,
    fats: 0.1,
    carbs: 0.8,
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
  },
];

// Base prices in RUB
const RU_PRICES: Record<string, number> = {
  espresso: 149,
  americano: 179,
  cappuccino: 219,
  latte: 239,
  'flat-white': 229,
  'lemonade-classic': 199,
  'lemonade-mango': 229,
  'lemonade-matcha': 219,
  'tea-black': 169,
  'tea-green': 169,
};

// Base prices in KZT (approx ×5 from RUB)
const KZ_PRICES: Record<string, number> = {
  espresso: 750,
  americano: 890,
  cappuccino: 1090,
  latte: 1190,
  'flat-white': 1140,
  'lemonade-classic': 990,
  'lemonade-mango': 1140,
  'lemonade-matcha': 1090,
  'tea-black': 840,
  'tea-green': 840,
};

// Price changes (% for demo purposes)
const PRICE_CHANGES: Record<string, number> = {
  espresso: 3.2,
  americano: -1.8,
  cappuccino: 0.0,
  latte: 5.4,
  'flat-white': -2.1,
  'lemonade-classic': 0.0,
  'lemonade-mango': 7.8,
  'lemonade-matcha': -3.5,
  'tea-black': 1.2,
  'tea-green': 0.0,
};

function buildDrink(template: DrinkTemplate, countryId: string): Drink {
  const priceMap = countryId === 'KZ' ? KZ_PRICES : RU_PRICES;
  const base = priceMap[template.id] ?? 199;
  const change = PRICE_CHANGES[template.id] ?? 0;
  const history = generatePriceHistory(base, base + template.id.charCodeAt(0));
  const prices = history.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const current = history[history.length - 1].price;

  return {
    ...template,
    currentPrice: current,
    basePrice: base,
    minPrice: Math.round(min * 100) / 100,
    maxPrice: Math.round(max * 100) / 100,
    priceChange: change,
    trend: computeTrend(change),
    priceHistory: history,
    countryId,
    available: true,
  };
}

export const DRINKS_RU: Drink[] = DRINK_TEMPLATES.map((t) => buildDrink(t, 'RU'));
export const DRINKS_KZ: Drink[] = DRINK_TEMPLATES.map((t) => buildDrink(t, 'KZ'));

export function getDrinksByCountry(countryId: string): Drink[] {
  return countryId === 'KZ' ? DRINKS_KZ : DRINKS_RU;
}

export function getDrinkById(id: string, countryId: string): Drink | undefined {
  return getDrinksByCountry(countryId).find((d) => d.id === id);
}

import type { Drink, DrinkCategory, PriceTrend, VolumePrice } from '@/types';
import { parsePrice, type ApiPriceItem } from '@/lib/api';
import {
  findTemplateById,
  findTemplateByName,
  generatePriceHistory,
  computeTrend,
  normalizeDrinkName,
} from '@/lib/mock-data/menu';

// ─── Category inference ───────────────────────────────────────────────────────

const BACKEND_NAME_TO_CATEGORY: Record<string, DrinkCategory> = {
  эспрессо: 'coffee',
  американо: 'coffee',
  латте: 'coffee',
  'флэт уайт': 'coffee',
  'раф классический': 'coffee',
  'раф лавандовый': 'coffee',
  'матча латте': 'coffee',
  какао: 'coffee',
  'горячий шоколад': 'coffee',
  'чай черный': 'tea',
  'чай зеленый': 'tea',
  бамбл: 'coffee',
  'колд брю': 'coffee',
  'айс латте': 'coffee',
};

export function inferDrinkCategoryFromApiName(name: string): DrinkCategory {
  const key = normalizeDrinkName(name);
  const direct = BACKEND_NAME_TO_CATEGORY[key];
  if (direct) return direct;
  if (key.includes('чай')) return 'tea';
  if (key.includes('лимонад') || key.includes('лимон')) return 'lemonade';
  return 'coffee';
}

// ─── Route ID helpers ─────────────────────────────────────────────────────────

const CYR_TO_LAT: [string, string][] = [
  ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'e'], ['ж', 'zh'],
  ['з', 'z'], ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'],
  ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'], ['ц', 'ts'],
  ['ч', 'ch'], ['ш', 'sh'], ['щ', 'sch'], ['ъ', ''], ['ы', 'y'], ['ь', ''], ['э', 'e'], ['ю', 'yu'],
  ['я', 'ya'],
];

export function drinkRouteIdFromName(name: string): string {
  let s = normalizeDrinkName(name);
  for (const [cyr, lat] of CYR_TO_LAT) s = s.split(cyr).join(lat);
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'drink';
}

export function drinkRouteId(templateId: string | undefined, displayName: string): string {
  return templateId ?? drinkRouteIdFromName(displayName);
}

// ─── Data transformation: API → UI model ──────────────────────────────────────

export function buildDrinkFromGroup(
  entries: ApiPriceItem[],
  countryId: string,
): Drink | null {
  if (entries.length === 0) return null;

  const name = entries[0].name;
  const template = findTemplateByName(name);
  const category = template?.category ?? inferDrinkCategoryFromApiName(name);

  const sorted = [...entries].sort((a, b) => parseFloat(a.volume) - parseFloat(b.volume));

  const volumes: VolumePrice[] = sorted.map((entry) => {
    const basePrice = parsePrice(entry.base_price);
    const currentPrice = parsePrice(entry.current_price);
    const currentPct = parsePrice(entry.current_pct);
    const trend: PriceTrend = entry.is_fixed ? 'neutral' : computeTrend(currentPct);
    const seed = basePrice + (name.charCodeAt(0) || 0) + parseFloat(entry.volume || '0') * 100;
    const history = generatePriceHistory(basePrice, seed);
    if (history.length > 0) {
      history[history.length - 1] = { ...history[history.length - 1], price: currentPrice };
    }
    return {
      value: entry.volume,
      label: `${entry.volume} л`,
      price: currentPrice,
      basePrice,
      apiDrinkId: entry.drink_id,
      change: currentPct,
      trend,
      priceHistory: history,
    };
  });

  const midVol = volumes[Math.floor(volumes.length / 2)] ?? volumes[0];
  const firstEntry = sorted[0];
  const basePrice = parsePrice(firstEntry.base_price);
  const minPct = parsePrice(firstEntry.min_pct);
  const maxPct = parsePrice(firstEntry.max_pct);
  const seed = basePrice + (name.charCodeAt(0) || 0);

  return {
    id: drinkRouteId(template?.id, name),
    name,
    nameShort: template?.nameShort ?? name,
    category,
    volume: template?.volume ?? (midVol.label || ''),
    currentPrice: midVol.price,
    basePrice,
    minPrice: basePrice * (1 + minPct / 100),
    maxPrice: basePrice * (1 + maxPct / 100),
    priceChange: midVol.change,
    trend: midVol.trend,
    description: template?.description ?? '',
    calories: template?.calories ?? 0,
    proteins: template?.proteins ?? 0,
    fats: template?.fats ?? 0,
    carbs: template?.carbs ?? 0,
    priceHistory: generatePriceHistory(basePrice, seed),
    countryId,
    available: true,
    photoUrl: template?.photoUrl,
    volumes,
  };
}

/** Все записи API для конкретной страницы напитка (по ID шаблона, slug или drink_id). */
export function getPriceEntriesForDrinkRoute(
  drinkRouteParam: string,
  prices: ApiPriceItem[],
): ApiPriceItem[] {
  const template = findTemplateById(drinkRouteParam);
  if (template) {
    const tn = normalizeDrinkName(template.name);
    return prices.filter((p) => normalizeDrinkName(p.name) === tn);
  }

  const bySlug = prices.filter((p) => drinkRouteIdFromName(p.name) === drinkRouteParam);
  if (bySlug.length > 0) return bySlug;

  const hit = prices.find((p) => p.drink_id === drinkRouteParam);
  if (hit) {
    const hn = normalizeDrinkName(hit.name);
    return prices.filter((p) => normalizeDrinkName(p.name) === hn);
  }

  return [];
}

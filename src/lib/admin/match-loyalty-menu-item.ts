import type { AdminDrinkRead } from '@/lib/api/exchange/admin-drinks';
import type { ApiMenuItem } from '@/lib/api/loyalty/types';

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function volumeFromSizeName(sizeName: string): number | null {
  const n = parseFloat(sizeName.replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function volumesMatch(unitCapacity: number | null | undefined, sizeName: string): boolean {
  const vol = volumeFromSizeName(sizeName);
  if (unitCapacity == null || vol == null) return true;
  return Math.abs(unitCapacity - vol) < 0.021;
}

/** Связь напитка Pricing с позицией меню Loyalty (как на странице «Цены в Бинах»). */
export function matchLoyaltyMenuItem(
  drink: AdminDrinkRead,
  items: ApiMenuItem[],
): ApiMenuItem | null {
  if (items.length === 0) return null;

  const byPricingId = items.find((i) => i.id === drink.drink_id);
  if (byPricingId) return byPricingId;

  const pos = drink.pos_item_id?.trim();
  if (pos) {
    const byPos = items.filter((i) => (i.pos_item_id ?? '').trim() === pos);
    if (byPos.length === 1) return byPos[0];
    if (byPos.length > 1) {
      const sized = byPos.find((i) => volumesMatch(drink.unitCapacity, i.size_name));
      return sized ?? byPos[0];
    }
  }

  const name = normName(drink.name);
  const byName = items.filter((i) => normName(i.name) === name);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) {
    const sized = byName.find((i) => volumesMatch(drink.unitCapacity, i.size_name));
    if (sized) return sized;
  }

  const looseName = items.filter((i) => normName(i.name).includes(name) || name.includes(normName(i.name)));
  if (looseName.length === 1) return looseName[0];
  if (looseName.length > 1) {
    const sized = looseName.find((i) => volumesMatch(drink.unitCapacity, i.size_name));
    if (sized) return sized;
  }

  return null;
}

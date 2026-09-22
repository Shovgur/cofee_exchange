import { fetchStores } from '@/lib/api/loyalty/stores';
import { mapApiStoreToCoffeeShop } from '@/lib/stores-mapper';
import type { CoffeeShop } from '@/types';

/** Загружает опубликованные кофейни с API лояльности. */
export async function fetchShops(countryCode?: string): Promise<CoffeeShop[]> {
  try {
    const stores = await fetchStores(countryCode);
    return stores
      .map(mapApiStoreToCoffeeShop)
      .filter((s): s is CoffeeShop => s !== null);
  } catch {
    return [];
  }
}

/** @deprecated Синхронный список пуст — используйте fetchShops. */
export function getAllShops(): CoffeeShop[] {
  return [];
}

export function getShopsByCountry(_countryId: string): CoffeeShop[] {
  return [];
}

export function isShopOpen(shop: CoffeeShop): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  for (const wh of shop.workHours) {
    const isForToday =
      wh.days.includes('–')
        ? (isWeekend
          ? wh.days.includes('Сб') || wh.days.includes('Вс')
          : wh.days.includes('Пн') || wh.days.includes('Вт') || wh.days.includes('Ср') || wh.days.includes('Чт') || wh.days.includes('Пт'))
        : true;

    if (!isForToday) continue;

    const [openH, openM] = wh.open.split(':').map(Number);
    const [closeH, closeM] = wh.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    let closeMin = closeH * 60 + closeM;
    if (closeMin < openMin) closeMin += 24 * 60;

    if (currentMinutes >= openMin && currentMinutes < closeMin) return true;
  }

  return false;
}

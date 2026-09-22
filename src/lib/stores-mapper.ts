import type { ApiStore, StoreWorkingHours } from '@/lib/api/loyalty/stores';
import type { CoffeeShop, WorkHours } from '@/types';

const DAY_LABEL: Record<string, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
};

function workingHoursToUi(hours: StoreWorkingHours | null): WorkHours[] {
  if (!hours) return [];
  const entries = Object.entries(hours).filter(([, v]) => v && v.open && v.close) as [
    string,
    { open: string; close: string },
  ][];
  if (entries.length === 0) return [];

  // Группируем дни с одинаковым расписанием в одну строку
  const bySchedule = new Map<string, string[]>();
  for (const [day, slot] of entries) {
    const key = `${slot.open}-${slot.close}`;
    const list = bySchedule.get(key) ?? [];
    list.push(DAY_LABEL[day] ?? day);
    bySchedule.set(key, list);
  }

  return Array.from(bySchedule.entries()).map(([schedule, days]) => {
    const [open, close] = schedule.split('-');
    const label =
      days.length >= 5 && days.includes('Пн') && days.includes('Пт')
        ? 'Пн–Пт'
        : days.length === 2 && days.includes('Сб') && days.includes('Вс')
          ? 'Сб–Вс'
          : days.join(', ');
    return { days: label, open, close };
  });
}

function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function mapApiStoreToCoffeeShop(store: ApiStore): CoffeeShop | null {
  const lat = parseCoord(store.latitude);
  const lng = parseCoord(store.longitude);
  if (lat == null || lng == null) return null;
  const photos = store.photos ?? [];
  return {
    id: store.id,
    name: store.name || 'Кофейня',
    address: store.address ?? '',
    lat,
    lng,
    workHours: workingHoursToUi(store.working_hours),
    countryId: store.country_code ?? 'RU',
    rating: 4.8,
    photoUrl: photos[0] ?? undefined,
  };
}

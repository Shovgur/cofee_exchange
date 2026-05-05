import type { CoffeeShop } from '@/types';

export const COFFEE_SHOPS: CoffeeShop[] = [
  // Russia — Moscow
  {
    id: 'ru-1',
    name: 'Coffee Exchange — Арбат',
    address: 'ул. Арбат, 12, Москва',
    lat: 55.7494,
    lng: 37.5983,
    workHours: [
      { days: 'Пн–Пт', open: '07:30', close: '22:00' },
      { days: 'Сб–Вс', open: '09:00', close: '23:00' },
    ],
    countryId: 'RU',
    rating: 4.8,
    photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
  },
  {
    id: 'ru-2',
    name: 'Coffee Exchange — Покровка',
    address: 'ул. Покровка, 27, Москва',
    lat: 55.7563,
    lng: 37.6465,
    workHours: [
      { days: 'Пн–Пт', open: '08:00', close: '22:00' },
      { days: 'Сб–Вс', open: '09:00', close: '22:00' },
    ],
    countryId: 'RU',
    rating: 4.7,
    photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
  },
  {
    id: 'ru-3',
    name: 'Coffee Exchange — Патриаршие',
    address: 'Малый Козихинский пер., 4, Москва',
    lat: 55.7639,
    lng: 37.5963,
    workHours: [
      { days: 'Пн–Пт', open: '07:00', close: '23:00' },
      { days: 'Сб–Вс', open: '08:00', close: '00:00' },
    ],
    countryId: 'RU',
    rating: 4.9,
    photoUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  },
  {
    id: 'ru-4',
    name: 'Coffee Exchange — Китай-город',
    address: 'ул. Солянка, 14, Москва',
    lat: 55.7517,
    lng: 37.6372,
    workHours: [
      { days: 'Пн–Вс', open: '08:00', close: '22:00' },
    ],
    countryId: 'RU',
    rating: 4.6,
    photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80',
  },
  {
    id: 'ru-5',
    name: 'Coffee Exchange — Флакон',
    address: 'ул. Большая Новодмитровская, 36, Москва',
    lat: 55.7942,
    lng: 37.5944,
    workHours: [
      { days: 'Пн–Пт', open: '09:00', close: '21:00' },
      { days: 'Сб–Вс', open: '10:00', close: '22:00' },
    ],
    countryId: 'RU',
    rating: 4.7,
  },

  // Kazakhstan — Almaty
  {
    id: 'kz-1',
    name: 'Coffee Exchange — Алматы Тауэрс',
    address: 'пр. Аль-Фараби, 7, Алматы',
    lat: 43.2151,
    lng: 76.9096,
    workHours: [
      { days: 'Пн–Пт', open: '08:00', close: '22:00' },
      { days: 'Сб–Вс', open: '09:00', close: '23:00' },
    ],
    countryId: 'KZ',
    rating: 4.8,
    photoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
  },
  {
    id: 'kz-2',
    name: 'Coffee Exchange — Достык Плаза',
    address: 'пр. Достык, 111, Алматы',
    lat: 43.2359,
    lng: 76.9545,
    workHours: [
      { days: 'Пн–Вс', open: '09:00', close: '22:00' },
    ],
    countryId: 'KZ',
    rating: 4.6,
    photoUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  },
  {
    id: 'kz-3',
    name: 'Coffee Exchange — MEGA Alma-Ata',
    address: 'пр. Розыбакиева, 247А, Алматы',
    lat: 43.2576,
    lng: 76.8824,
    workHours: [
      { days: 'Пн–Вс', open: '10:00', close: '22:00' },
    ],
    countryId: 'KZ',
    rating: 4.5,
  },
  {
    id: 'kz-4',
    name: 'Coffee Exchange — Горный гигант',
    address: 'ул. Маркова, 84, Алматы',
    lat: 43.2108,
    lng: 76.9247,
    workHours: [
      { days: 'Пн–Пт', open: '07:30', close: '21:00' },
      { days: 'Сб–Вс', open: '09:00', close: '22:00' },
    ],
    countryId: 'KZ',
    rating: 4.7,
  },
];

export function getShopsByCountry(countryId: string): CoffeeShop[] {
  return COFFEE_SHOPS.filter((s) => s.countryId === countryId);
}

export function getAllShops(): CoffeeShop[] {
  return COFFEE_SHOPS;
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

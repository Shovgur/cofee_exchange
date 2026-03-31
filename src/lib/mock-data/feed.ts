import type { FeedItem } from '@/types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const FEED_ITEMS: FeedItem[] = [
  // Russia — news / promos / events
  {
    id: 'ru-news-1',
    type: 'news',
    title: 'Новый сезонный напиток — Тыквенный спайс латте',
    description:
      'Встречайте осень вместе с нами! Тыквенный спайс латте уже в меню всех кофеен. Согревающий кофе с пряной тыквой и корицей доступен до конца ноября.',
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80',
    publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    countryId: 'RU',
    link: { type: 'menu' },
  },
  {
    id: 'ru-promo-1',
    type: 'promotion',
    title: 'Счастливые часы: −20% с 15:00 до 17:00',
    description:
      'Каждый будний день с 15:00 до 17:00 скидка 20% на все напитки. Покупай через приложение и экономь. Акция действует до конца месяца.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    countryId: 'RU',
  },
  {
    id: 'ru-event-1',
    type: 'event',
    title: 'Мастер-класс по латте-арт — 28 марта',
    description:
      'Приглашаем на бесплатный мастер-класс по латте-арт в наш флагманский кофейня на Покровке. Научитесь рисовать сердце и розетку. Регистрация по ссылке.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    publishedAt: new Date(now - 1 * day).toISOString(),
    countryId: 'RU',
    link: { type: 'map' },
  },
  {
    id: 'ru-new-drink-1',
    type: 'new_drink',
    title: 'В меню появился Флэт Уайт на овсяном молоке',
    description:
      'По многочисленным просьбам: теперь Флэт Уайт доступен на овсяном молоке без доплаты. Попробуй нежный вкус с растительной молочной пеной.',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
    publishedAt: new Date(now - 2 * day).toISOString(),
    countryId: 'RU',
    link: { type: 'drink', drinkId: 'flat-white' },
  },
  {
    id: 'ru-news-2',
    title: 'Coffee Exchange теперь в Санкт-Петербурге',
    type: 'news',
    description:
      'Открылись три новые кофейни в Петербурге: на Невском проспекте, Васильевском острове и в Петроградском районе. Все точки уже на карте.',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    publishedAt: new Date(now - 3 * day).toISOString(),
    countryId: 'RU',
    link: { type: 'map' },
  },
  {
    id: 'ru-promo-2',
    type: 'promotion',
    title: 'Приведи друга — получи напиток в подарок',
    description:
      'Поделись своим промокодом из профиля. Когда друг сделает первую покупку, ты получишь бесплатный капучино. Без ограничений по количеству друзей.',
    publishedAt: new Date(now - 4 * day).toISOString(),
    countryId: 'RU',
  },

  // Russia — IPO
  {
    id: 'ru-ipo-1',
    type: 'ipo',
    title: 'IPO напитка: Латте Орео',
    description:
      'Авторский латте с кремом Орео и хрустящей крошкой. Предзакажи по фиксированной цене до старта продаж.',
    imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&q=80',
    publishedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    countryId: 'RU',
    link: { type: 'ipo', ipoId: 'latte-oreo' },
  },
  {
    id: 'ru-ipo-2',
    type: 'ipo',
    title: 'IPO напитка: Матча Кокос',
    description:
      'Японская матча с кокосовым молоком — тропический бодрящий хит. Фиксированная цена только до открытия торгов.',
    imageUrl: 'https://images.unsplash.com/photo-1617882817697-38f6f62c31e7?w=800&q=80',
    publishedAt: new Date(now - 1 * day - 6 * 60 * 60 * 1000).toISOString(),
    countryId: 'RU',
    link: { type: 'ipo', ipoId: 'matcha-coconut' },
  },
  {
    id: 'ru-ipo-3',
    type: 'ipo',
    title: 'IPO напитка: Иван-чай авторский',
    description:
      'Ферментированный иван-чай с мёдом и имбирём из Карелии. Зафиксируй цену прямо сейчас.',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
    publishedAt: new Date(now - 2 * day - 3 * 60 * 60 * 1000).toISOString(),
    countryId: 'RU',
    link: { type: 'ipo', ipoId: 'ivan-tea-signature' },
  },

  // Kazakhstan
  {
    id: 'kz-news-1',
    type: 'news',
    title: 'Coffee Exchange открыл новую точку в Алматы Тауэрс',
    description:
      'Встречайте нас в Алматы Тауэрс! Новая кофейня с панорамным видом на горы. Теперь кофе с видом — реальность.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    countryId: 'KZ',
    link: { type: 'map' },
  },
  {
    id: 'kz-promo-1',
    type: 'promotion',
    title: 'Утренняя скидка 15% до 10:00',
    description:
      'Хороший кофе с утра должен быть доступным. Каждый будний день до 10:00 скидка 15% на все позиции меню при покупке через приложение.',
    imageUrl: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&q=80',
    publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    countryId: 'KZ',
  },
  {
    id: 'kz-event-1',
    type: 'event',
    title: 'Barista Day в Coffee Exchange Алматы',
    description:
      'В пятницу 29 марта наши бариста проведут открытый день: покажут технику заваривания, расскажут о зерне и угостят авторскими напитками.',
    publishedAt: new Date(now - 2 * day).toISOString(),
    countryId: 'KZ',
    link: { type: 'map' },
  },
  {
    id: 'kz-new-drink-1',
    type: 'new_drink',
    title: 'Новинка: Матча Лимонад уже в Казахстане',
    description:
      'Японский чай матча встречается с лимоном и газированной водой. Освежающий, необычный, с натуральной зеленью и ярким вкусом.',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
    publishedAt: new Date(now - 3 * day).toISOString(),
    countryId: 'KZ',
    link: { type: 'drink', drinkId: 'lemonade-matcha' },
  },
  {
    id: 'kz-ipo-1',
    type: 'ipo',
    title: 'IPO напитка: Латте Орео',
    description:
      'Авторский латте с кремом Орео и хрустящей крошкой. Предзакажи по фиксированной цене до старта продаж.',
    imageUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&q=80',
    publishedAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    countryId: 'KZ',
    link: { type: 'ipo', ipoId: 'latte-oreo-kz' },
  },
  {
    id: 'kz-ipo-2',
    type: 'ipo',
    title: 'IPO напитка: Матча Кокос',
    description:
      'Японская матча с кокосовым молоком — тропический бодрящий хит. Фиксированная цена только до открытия торгов.',
    imageUrl: 'https://images.unsplash.com/photo-1617882817697-38f6f62c31e7?w=800&q=80',
    publishedAt: new Date(now - 2 * day).toISOString(),
    countryId: 'KZ',
    link: { type: 'ipo', ipoId: 'matcha-coconut-kz' },
  },
];

export function getFeedByCountry(countryId: string): FeedItem[] {
  return FEED_ITEMS.filter((item) => item.countryId === countryId);
}

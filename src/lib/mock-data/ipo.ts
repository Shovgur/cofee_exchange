import type { IpoDrink } from '@/types';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const IPO_DRINKS: IpoDrink[] = [
  // Russia
  {
    id: 'latte-oreo',
    name: 'Латте Орео',
    nameShort: 'Латте Орео',
    category: 'coffee',
    description: 'Авторский латте с кремом Орео и хрустящей крошкой. Лимитированная серия.',
    fullDescription:
      'Нежный двойной эспрессо с ванильным сиропом, молочной пеной и фирменным кремом Орео. Сверху — хрустящая крошка из печенья. Напиток доступен в ограниченном количестве каждую неделю — успей предзаказать по фиксированной цене до старта продаж.',
    photoUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600&q=80',
    preorderPrice: 219,
    countryId: 'RU',
    status: 'upcoming',
    saleStartsAt: new Date(now + 3 * day + 4 * 60 * 60 * 1000).toISOString(),
    volumes: [
      { label: '0.2 л', value: '0.2', preorderPrice: 169 },
      { label: '0.4 л', value: '0.4', preorderPrice: 219 },
      { label: '0.6 л', value: '0.6', preorderPrice: 279 },
    ],
  },
  {
    id: 'matcha-coconut',
    name: 'Матча Кокос',
    nameShort: 'Матча Кокос',
    category: 'lemonade',
    description: 'Японская матча с кокосовым молоком и льдом. Тропический бодрящий новинка.',
    fullDescription:
      'Церемониальная матча первого сбора смешивается с охлаждённым кокосовым молоком и щепоткой морской соли. Стимулирующий, освежающий напиток с чистой энергией без кофеинового удара. Идеален для тёплых дней.',
    photoUrl: 'https://images.unsplash.com/photo-1617882817697-38f6f62c31e7?w=600&q=80',
    preorderPrice: 259,
    countryId: 'RU',
    status: 'upcoming',
    saleStartsAt: new Date(now + 10 * day + 2 * 60 * 60 * 1000).toISOString(),
    volumes: [
      { label: '0.2 л', value: '0.2', preorderPrice: 199 },
      { label: '0.4 л', value: '0.4', preorderPrice: 259 },
      { label: '0.6 л', value: '0.6', preorderPrice: 319 },
    ],
  },
  {
    id: 'ivan-tea-signature',
    name: 'Иван-чай авторский',
    nameShort: 'Иван-чай',
    category: 'tea',
    description: 'Ферментированный иван-чай с мёдом, имбирём и лимонной цедрой.',
    fullDescription:
      'Традиционный русский ферментированный иван-чай, собранный вручную в Карелии. Настаивается с диким мёдом, свежим имбирём и органической лимонной цедрой. Согревающий, антиоксидантный напиток с богатым флоральным вкусом.',
    photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
    preorderPrice: 189,
    countryId: 'RU',
    status: 'upcoming',
    saleStartsAt: new Date(now + 17 * day + 9 * 60 * 60 * 1000).toISOString(),
    volumes: [
      { label: '0.2 л', value: '0.2', preorderPrice: 149 },
      { label: '0.4 л', value: '0.4', preorderPrice: 189 },
      { label: '0.6 л', value: '0.6', preorderPrice: 239 },
    ],
  },

  // Kazakhstan
  {
    id: 'latte-oreo-kz',
    name: 'Латте Орео',
    nameShort: 'Латте Орео',
    category: 'coffee',
    description: 'Авторский латте с кремом Орео и хрустящей крошкой. Лимитированная серия.',
    fullDescription:
      'Нежный двойной эспрессо с ванильным сиропом, молочной пеной и фирменным кремом Орео. Сверху — хрустящая крошка из печенья. Напиток доступен в ограниченном количестве каждую неделю — успей предзаказать по фиксированной цене до старта продаж.',
    photoUrl: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600&q=80',
    preorderPrice: 1090,
    countryId: 'KZ',
    status: 'upcoming',
    saleStartsAt: new Date(now + 3 * day + 4 * 60 * 60 * 1000).toISOString(),
    volumes: [
      { label: '0.2 л', value: '0.2', preorderPrice: 840 },
      { label: '0.4 л', value: '0.4', preorderPrice: 1090 },
      { label: '0.6 л', value: '0.6', preorderPrice: 1390 },
    ],
  },
  {
    id: 'matcha-coconut-kz',
    name: 'Матча Кокос',
    nameShort: 'Матча Кокос',
    category: 'lemonade',
    description: 'Японская матча с кокосовым молоком и льдом. Тропический бодрящий новинка.',
    fullDescription:
      'Церемониальная матча первого сбора смешивается с охлаждённым кокосовым молоком и щепоткой морской соли. Стимулирующий, освежающий напиток с чистой энергией без кофеинового удара. Идеален для тёплых дней.',
    photoUrl: 'https://images.unsplash.com/photo-1617882817697-38f6f62c31e7?w=600&q=80',
    preorderPrice: 1290,
    countryId: 'KZ',
    status: 'upcoming',
    saleStartsAt: new Date(now + 10 * day + 2 * 60 * 60 * 1000).toISOString(),
    volumes: [
      { label: '0.2 л', value: '0.2', preorderPrice: 990 },
      { label: '0.4 л', value: '0.4', preorderPrice: 1290 },
      { label: '0.6 л', value: '0.6', preorderPrice: 1590 },
    ],
  },
];

export function getIpoDrinksByCountry(countryId: string): IpoDrink[] {
  return IPO_DRINKS.filter((d) => d.countryId === countryId);
}

export function getIpoDrinkById(id: string): IpoDrink | undefined {
  return IPO_DRINKS.find((d) => d.id === id);
}

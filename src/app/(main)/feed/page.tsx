'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getFeedByCountry, getIpoDrinkById } from '@/lib/mock-data';
import { cn, feedTypeLabel, feedTypeColor, formatDate, formatIpoCountdown } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { FeedItem, FeedItemType, FeedLink, IpoDrink } from '@/types';
import { ChevronRight, Rocket, Clock } from 'lucide-react';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

const FILTERS: { value: 'all' | FeedItemType; label: string }[] = [
  { value: 'all',       label: 'Все' },
  { value: 'news',      label: 'Новости' },
  { value: 'promotion', label: 'Акции' },
  { value: 'ipo',       label: 'IPO напитков' },
];

/** Обратный отсчёт — обновляется каждую секунду */
function IpoCountdown({ saleStartsAt }: { saleStartsAt: string }) {
  const [label, setLabel] = useState<string>('');

  useEffect(() => {
    const tick = () => setLabel(formatIpoCountdown(saleStartsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saleStartsAt]);

  return <span className="tabular-nums font-bold text-orange">{label}</span>;
}

/** Карточка IPO-напитка */
function IpoCard({ item, ipo }: { item: FeedItem; ipo: IpoDrink }) {
  const router = useRouter();

  return (
    <article className="bg-surface rounded-2xl overflow-hidden border border-yellow-500/20">
      {item.imageUrl && (
        <div className="relative h-44 w-full bg-surface-el">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            unoptimized
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
          {/* IPO badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-500/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
            <Rocket size={11} />
            IPO напитков
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted">{formatDate(item.publishedAt)}</span>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock size={11} />
            <span>до старта:</span>
            <IpoCountdown saleStartsAt={ipo.saleStartsAt} />
          </div>
        </div>

        <h2 className="font-bold text-base leading-snug mb-1.5">{ipo.name}</h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-2">{ipo.description}</p>

        {/* Preorder price */}
        <div className="flex items-center gap-3 mt-3 mb-3">
          <div className="bg-surface-el rounded-xl px-3 py-1.5 text-sm">
            <span className="text-muted text-xs">Предзаказ </span>
            <span className="font-bold text-orange">{ipo.preorderPrice} ₽</span>
          </div>
          <span className="text-xs text-muted">фиксированная цена</span>
        </div>

        <button
          onClick={() => router.push(`/ipo/${ipo.id}`)}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-semibold text-sm py-2.5 rounded-xl transition-colors"
        >
          <Rocket size={14} />
          Подробнее и предзаказ
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

/** Обычная карточка ленты */
function FeedCard({ item, onLink }: { item: FeedItem; onLink: (link?: FeedLink) => void }) {
  return (
    <article
      className={cn(
        'bg-surface rounded-2xl overflow-hidden',
        item.link && 'cursor-pointer active:scale-[0.98] transition-transform hover:bg-surface-el',
      )}
      onClick={() => onLink(item.link)}
    >
      {item.imageUrl && (
        <div className="relative h-44 w-full bg-surface-el">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            unoptimized
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={feedTypeColor(item.type)}>{feedTypeLabel(item.type)}</Badge>
          <span className="text-xs text-muted">{formatDate(item.publishedAt)}</span>
        </div>
        <h2 className="font-semibold text-base leading-snug mb-1.5">{item.title}</h2>
        <p className="text-sm text-muted leading-relaxed line-clamp-3">{item.description}</p>
        {item.link && item.link.type !== 'ipo' && (
          <div className="flex items-center gap-1 mt-3 text-orange text-sm font-medium">
            <span>
              {item.link.type === 'map'
                ? 'На карту'
                : item.link.type === 'menu'
                ? 'В меню'
                : 'К напитку'}
            </span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>
    </article>
  );
}

export default function FeedPage() {
  const { country } = useCountry();
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | FeedItemType>('all');

  const allItems = getFeedByCountry(country.id);
  const items = allItems.filter(
    (item) => filter === 'all' || item.type === filter,
  );

  function handleLinkAction(link?: FeedLink) {
    if (!link) return;
    if (link.type === 'map')    router.push('/map');
    if (link.type === 'menu')   router.push('/menu');
    if (link.type === 'drink')  router.push(`/menu/${link.drinkId}`);
    if (link.type === 'ipo')    router.push(`/ipo/${link.ipoId}`);
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col lg:flex-none lg:min-h-full">
      {/* Прокрутка только у <main>: без вложенного overflow — иначе sticky табов не работает */}
      <div className="flex w-full flex-col">
        {/* Шапка — скроллится */}
        <div className="shrink-0 px-4 lg:px-8 pt-4 lg:pt-8 pb-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-xl lg:text-3xl font-bold">Лента</h1>
              <p className="text-xs lg:text-sm text-muted mt-0.5">
                Новости, акции и события
              </p>
              {user ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-amber-400/95">
                    <span>
                      {new Intl.NumberFormat("ru-RU").format(user.loyaltyPoints)}
                    </span>
                    <CoffeeBeanIcon size={16} className="shrink-0" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            // max-lg: без backdrop-blur — в Safari blur часто ломает sticky; скролл только в <main> (layout)
            'max-lg:sticky max-lg:top-0 z-[10025] shrink-0 w-full border-b border-border/60 max-lg:bg-bg bg-bg/95 px-4 lg:px-8 py-2.5 max-lg:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.85)] lg:backdrop-blur-lg lg:shadow-none lg:supports-[backdrop-filter]:bg-bg/85 lg:static lg:z-auto',
          )}
        >
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-select">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border border-transparent',
                  filter === value
                    ? value === 'ipo'
                      ? 'bg-yellow-500 text-black border-yellow-400/40'
                      : 'bg-orange text-white'
                    : 'bg-surface-el text-muted hover:text-white',
                )}
              >
                {value === 'ipo' && <Rocket size={12} className="inline mr-1" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-4 lg:px-8 pt-4 pb-8">
          {items.length === 0 && (
            <div className="text-center text-muted py-16">Нет материалов</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
            {items.map((item) => {
              if (item.type === 'ipo' && item.link?.type === 'ipo') {
                const ipo = getIpoDrinkById(item.link.ipoId);
                if (ipo) return <IpoCard key={item.id} item={item} ipo={ipo} />;
              }
              return (
                <FeedCard key={item.id} item={item} onLink={handleLinkAction} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

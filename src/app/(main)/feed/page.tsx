'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCountry } from '@/contexts/CountryContext';
import { cn, feedTypeLabel, feedTypeColor, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { FeedItem, FeedItemType, FeedLink } from '@/types';
import { ChevronRight, Rocket } from 'lucide-react';

const FILTERS: { value: 'all' | FeedItemType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'news', label: 'Новости' },
  { value: 'promotion', label: 'Акции' },
  { value: 'ipo', label: 'IPO напитков' },
];

function FeedCard({
  item,
  onLink,
}: {
  item: FeedItem;
  onLink: (link?: FeedLink) => void;
}) {
  return (
    <article
      className={cn(
        'bg-surface rounded-2xl overflow-hidden p-4',
        item.link &&
          'cursor-pointer active:scale-[0.98] transition-transform hover:bg-surface-el',
      )}
      onClick={() => onLink(item.link)}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge className={feedTypeColor(item.type)}>{feedTypeLabel(item.type)}</Badge>
        <span className="text-xs text-muted">{formatDate(item.publishedAt)}</span>
      </div>
      <h2 className="font-semibold text-base leading-snug mb-1.5">{item.title}</h2>
      <p className="text-sm text-muted leading-relaxed line-clamp-3">{item.description}</p>
      {item.link && (
        <div className="flex items-center gap-1 mt-3 text-orange text-sm font-medium">
          <span>Подробнее</span>
          <ChevronRight size={14} />
        </div>
      )}
    </article>
  );
}

export default function FeedPage() {
  useCountry();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | FeedItemType>('all');

  const items: FeedItem[] = [];

  function handleLinkAction(link?: FeedLink) {
    if (!link) return;
    if (link.type === 'map') router.push('/map');
    if (link.type === 'menu') router.push('/menu');
    if (link.type === 'drink') router.push(`/menu/${link.drinkId}`);
    if (link.type === 'ipo') router.push(`/ipo/${link.ipoId}`);
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col lg:flex-none lg:min-h-full">
      <div className="flex w-full flex-col">
        <div
          className={cn(
            'max-lg:sticky max-lg:top-0 z-[10025] shrink-0 w-full border-b border-border/60 max-lg:bg-bg bg-bg/95 px-4 lg:px-8 py-2.5 max-lg:shadow-[0_6px_20px_-12px_rgba(47,36,28,0.12)] lg:backdrop-blur-lg lg:shadow-none lg:supports-[backdrop-filter]:bg-bg/85 lg:static lg:z-auto',
          )}
        >
          <div className="touch-pan-x flex gap-2 overflow-x-auto pb-0.5 no-select">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border border-transparent',
                  filter === value
                    ? 'bg-orange text-white'
                    : 'bg-surface-el text-muted hover:text-foreground',
                )}
              >
                {value === 'ipo' && <Rocket size={12} className="inline mr-1" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-4 lg:px-8 pt-4 lg:pb-8">
          {items.length === 0 ? (
            <div className="text-center text-muted py-16">
              Публикаций пока нет
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
              {items.map((item) => (
                <FeedCard key={item.id} item={item} onLink={handleLinkAction} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

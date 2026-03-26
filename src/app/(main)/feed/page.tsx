'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCountry } from '@/contexts/CountryContext';
import { getFeedByCountry } from '@/lib/mock-data';
import { cn, feedTypeLabel, feedTypeColor, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import CountrySelector from '@/components/country/CountrySelector';
import type { FeedItemType, FeedLink } from '@/types';
import { ChevronRight, Globe } from 'lucide-react';

const FILTERS: { value: 'all' | FeedItemType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'news', label: 'Новости' },
  { value: 'promotion', label: 'Акции' },
  { value: 'event', label: 'События' },
];

export default function FeedPage() {
  const { country } = useCountry();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | FeedItemType>('all');
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  const items = getFeedByCountry(country.id).filter(
    (item) => filter === 'all' || item.type === filter,
  );

  function handleLinkAction(link?: FeedLink) {
    if (!link) return;
    if (link.type === 'map') router.push('/map');
    else if (link.type === 'menu') router.push('/menu');
    else if (link.type === 'drink') router.push(`/menu/${link.drinkId}`);
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold">Лента</h1>
            <p className="text-xs lg:text-sm text-muted mt-0.5">Новости, акции и события</p>
          </div>
          {/* Country switcher: visible on mobile, hidden on desktop (it's in sidebar) */}
          <button
            onClick={() => setShowCountrySelector(true)}
            className="lg:hidden flex items-center gap-1.5 bg-surface-el px-3 py-2 rounded-xl hover:bg-surface-ov transition-colors"
          >
            <Globe size={14} className="text-muted" />
            <span className="text-sm font-medium">{country.flag} {country.name}</span>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-select">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                filter === value
                  ? 'bg-orange text-white'
                  : 'bg-surface-el text-muted hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="px-4 lg:px-8 pt-2 pb-8">
        {items.length === 0 && (
          <div className="text-center text-muted py-16">Нет материалов</div>
        )}

        {/* Mobile: single column. Desktop: 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
          {items.map((item) => (
            <article
              key={item.id}
              className={cn(
                'bg-surface rounded-2xl overflow-hidden',
                item.link && 'cursor-pointer active:scale-[0.98] transition-transform hover:bg-surface-el',
              )}
              onClick={() => handleLinkAction(item.link)}
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
                  <Badge className={feedTypeColor(item.type)}>
                    {feedTypeLabel(item.type)}
                  </Badge>
                  <span className="text-xs text-muted">{formatDate(item.publishedAt)}</span>
                </div>
                <h2 className="font-semibold text-base leading-snug mb-1.5">
                  {item.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed line-clamp-3">
                  {item.description}
                </p>
                {item.link && (
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
          ))}
        </div>
      </div>

      <CountrySelector
        open={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
      />
    </div>
  );
}

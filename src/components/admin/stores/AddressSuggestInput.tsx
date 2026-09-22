'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AddressSuggestion } from '@/lib/geocode';

export type { AddressSuggestion };

async function fetchSuggestions(query: string): Promise<AddressSuggestion[]> {
  const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return (await res.json()) as AddressSuggestion[];
}

export default function AddressSuggestInput({
  value,
  onChange,
  onPick,
  className,
}: {
  value: string;
  onChange: (address: string) => void;
  onPick: (pick: AddressSuggestion) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 3) {
      setItems([]);
      setOpen(false);
      return;
    }

    const t = window.setTimeout(() => {
      setLoading(true);
      void fetchSuggestions(value.trim())
        .then((list) => {
          setItems(list);
          setOpen(list.length > 0);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => window.clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <label className="block text-sm font-medium mb-1">Адрес</label>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder="Начните вводить адрес…"
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>
      <p className="text-xs text-muted mt-1">Выберите подсказку — координаты заполнятся автоматически</p>

      {open && items.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface shadow-lg"
          role="listbox"
        >
          {items.map((item) => (
            <li key={`${item.lat}-${item.lng}-${item.label}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-orange/10 border-b border-border last:border-0"
                onClick={() => {
                  onChange(item.label);
                  onPick(item);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

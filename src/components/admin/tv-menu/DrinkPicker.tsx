'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Drink, DrinkCategory } from '@/types';
import { CATEGORY_EMOJI, CATEGORY_TITLE, CATEGORY_ORDER } from '@/lib/tv-menu/resolve';

export default function DrinkPicker({
  open,
  onClose,
  drinks,
  alreadyAdded,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  drinks: Drink[];
  /** Уже добавленные в секцию — показываем как выбранные и не дублируем. */
  alreadyAdded: string[];
  onConfirm: (drinkIds: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DrinkCategory | 'all'>('all');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) { setSearch(''); setCategory('all'); setSelected([]); }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drinks.filter((d) => {
      if (category !== 'all' && d.category !== category) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [drinks, search, category]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectAllVisible = () => {
    const ids = filtered.map((d) => d.id).filter((id) => !alreadyAdded.includes(id));
    setSelected((prev) => (ids.every((id) => prev.includes(id)) ? [] : ids));
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить напитки">
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию…"
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', ...CATEGORY_ORDER] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === c
                  ? 'border-orange bg-orange/10 text-orange'
                  : 'border-border text-muted hover:text-foreground',
              )}
            >
              {c === 'all' ? 'Все' : `${CATEGORY_EMOJI[c]} ${CATEGORY_TITLE[c]}`}
            </button>
          ))}
          <button
            type="button"
            onClick={selectAllVisible}
            className="ml-auto text-xs font-medium text-orange hover:underline"
          >
            Выбрать все
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-surface">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">Ничего не найдено</p>
          )}
          {filtered.map((d) => {
            const added = alreadyAdded.includes(d.id);
            const checked = selected.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                disabled={added}
                onClick={() => toggle(d.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border/50 px-4 py-2.5 text-left transition-colors last:border-0',
                  added ? 'opacity-45' : 'hover:bg-surface-el',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                    checked ? 'border-orange bg-orange text-white' : 'border-border',
                  )}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="shrink-0 text-base">{CATEGORY_EMOJI[d.category]}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{d.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {d.volumes.map((v) => v.label).join(' · ')}
                </span>
                {added && <span className="shrink-0 text-[10px] text-muted">добавлен</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button
            fullWidth
            disabled={selected.length === 0}
            onClick={() => { onConfirm(selected); onClose(); }}
          >
            Добавить{selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

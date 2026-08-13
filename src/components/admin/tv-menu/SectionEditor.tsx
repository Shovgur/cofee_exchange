'use client';

import { useState } from 'react';
import {
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Drink } from '@/types';
import {
  GRID_COLUMNS,
  GRID_ROWS,
  type TvMenuSection,
} from '@/lib/tv-menu/config';
import { Field, Segmented, TextInput, Toggle, ColorPicker } from '@/components/admin/tv-menu/controls';

const SECTION_BG_PRESETS = ['#1E1814', '#2A221C', '#3A2F27', '#FFFFFF', '#F7EFE6'];

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function NumberBox({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1">
      <span className="text-[10px] uppercase text-muted">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-9 bg-transparent text-xs font-semibold tabular-nums focus:outline-none"
      />
    </label>
  );
}

export default function SectionEditor({
  section,
  index,
  total,
  drinksById,
  selected,
  onSelect,
  onPatch,
  onRemove,
  onMove,
  onAddDrinks,
}: {
  section: TvMenuSection;
  index: number;
  total: number;
  drinksById: Map<string, Drink>;
  selected: boolean;
  onSelect: () => void;
  onPatch: (fn: (s: TvMenuSection) => TvMenuSection) => void;
  onRemove: () => void;
  onMove: (to: number) => void;
  onAddDrinks: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const patchRect = (key: 'x' | 'y' | 'w' | 'h', value: number) =>
    onPatch((s) => {
      const max = key === 'x' || key === 'w' ? GRID_COLUMNS : GRID_ROWS;
      const clamped = Math.min(max, Math.max(key === 'w' || key === 'h' ? 1 : 0, value));
      return { ...s, rect: { ...s.rect, [key]: clamped } };
    });

  const removeItem = (i: number) =>
    onPatch((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const moveItem = (from: number, to: number) =>
    onPatch((s) => ({ ...s, items: move(s.items, from, to) }));

  const toggleVolume = (i: number, volumeValue: string, allValues: string[]) =>
    onPatch((s) => ({
      ...s,
      items: s.items.map((item, idx) => {
        if (idx !== i) return item;
        // Пустой список означает «все объёмы», поэтому при первом снятии
        // галочки разворачиваем его в явный перечень.
        const current = item.volumes.length ? item.volumes : allValues;
        const next = current.includes(volumeValue)
          ? current.filter((v) => v !== volumeValue)
          : [...current, volumeValue];
        if (next.length === 0) return item;
        const isAll = next.length === allValues.length;
        return { ...item, volumes: isAll ? [] : next };
      }),
    }));

  return (
    <div
      onClick={onSelect}
      className={cn(
        'cursor-pointer rounded-2xl border bg-surface p-4 transition-colors',
        selected ? 'border-orange/60 ring-1 ring-orange/25' : 'border-border',
      )}
    >
      {/* Заголовок и позиция */}
      <div className="mb-3 flex items-center gap-2">
        <GripVertical size={16} className="shrink-0 text-muted" />
        <input
          type="text"
          value={section.title}
          onChange={(e) => onPatch((s) => ({ ...s, title: e.target.value }))}
          placeholder="Заголовок секции"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-border focus:border-orange/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onMove(index - 1)}
          disabled={index === 0}
          className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          title="Выше"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index + 1)}
          disabled={index === total - 1}
          className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground disabled:opacity-30"
          title="Ниже"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          title="Удалить секцию"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <NumberBox label="X" value={section.rect.x} min={0} max={GRID_COLUMNS - 1} onChange={(v) => patchRect('x', v)} />
        <NumberBox label="Y" value={section.rect.y} min={0} max={GRID_ROWS - 1} onChange={(v) => patchRect('y', v)} />
        <NumberBox label="Ш" value={section.rect.w} min={1} max={GRID_COLUMNS} onChange={(v) => patchRect('w', v)} />
        <NumberBox label="В" value={section.rect.h} min={1} max={GRID_ROWS} onChange={(v) => patchRect('h', v)} />
      </div>

      <div className="mb-3">
        <Segmented
          value={section.kind}
          onChange={(v) => onPatch((s) => ({ ...s, kind: v }))}
          options={[
            { value: 'drinks' as const, label: 'Напитки' },
            { value: 'media' as const, label: 'Картинка/видео' },
            { value: 'text' as const, label: 'Текст' },
          ]}
        />
      </div>

      {/* Напитки */}
      {section.kind === 'drinks' && (
        <div className="space-y-3">
          <Field label="Вид">
            <Segmented
              value={section.display}
              onChange={(v) => onPatch((s) => ({ ...s, display: v }))}
              options={[
                { value: 'cards' as const, label: 'Карточки' },
                { value: 'list' as const, label: 'Список' },
                { value: 'table' as const, label: 'Таблица' },
              ]}
            />
          </Field>

          {section.display === 'cards' && (
            <Field label="Колонок внутри секции">
              <Segmented
                value={section.columns ?? 0}
                onChange={(v) => onPatch((s) => ({ ...s, columns: v === 0 ? null : v }))}
                options={[
                  { value: 0, label: 'Авто' },
                  ...[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })),
                ]}
              />
            </Field>
          )}

          {section.display === 'table' && (
            <p className="rounded-xl bg-surface-el px-3 py-2 text-[11px] text-muted">
              Объёмы выносятся в шапку один раз, ниже — список напитков с ценами по колонкам.
            </p>
          )}

          <Toggle
            label="График цены"
            checked={section.showChart}
            onChange={(v) => onPatch((s) => ({ ...s, showChart: v }))}
          />

          <div className="space-y-1.5">
            {section.items.length === 0 && (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted">
                Пока пусто — добавьте напитки
              </p>
            )}

            {section.items.map((item, i) => {
              const drink = drinksById.get(item.drinkId);
              const allValues = drink?.volumes.map((v) => v.value) ?? [];
              const activeValues = item.volumes.length ? item.volumes : allValues;

              return (
                <div
                  key={`${item.drinkId}-${i}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== i) moveItem(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border border-border bg-surface-el px-3 py-2',
                    dragIndex === i && 'opacity-50',
                  )}
                >
                  <GripVertical size={14} className="shrink-0 cursor-grab text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-medium', !drink && 'text-danger')}>
                      {drink?.name ?? 'Нет на бирже'}
                    </p>
                    {drink && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {drink.volumes.map((v) => {
                          const on = activeValues.includes(v.value);
                          return (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => toggleVolume(i, v.value, allValues)}
                              className={cn(
                                'rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                on
                                  ? 'border-orange bg-orange/10 text-orange'
                                  : 'border-border text-muted line-through',
                              )}
                              title="Показывать этот объём"
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => moveItem(i, i - 1)}
                    disabled={i === 0}
                    className="rounded-lg p-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(i, i + 1)}
                    disabled={i === section.items.length - 1}
                    className="rounded-lg p-1 text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="rounded-lg p-1 text-muted transition-colors hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onAddDrinks}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted transition-colors hover:border-orange/50 hover:text-orange"
          >
            <Plus size={14} /> Добавить напитки
          </button>
        </div>
      )}

      {/* Картинка или видео */}
      {section.kind === 'media' && (
        <div className="space-y-3">
          <Field label="Ссылка на файл" hint="Прямая ссылка на картинку или видео (mp4)">
            <TextInput
              value={section.mediaUrl}
              onChange={(v) => onPatch((s) => ({ ...s, mediaUrl: v }))}
              placeholder="https://…/promo.jpg"
            />
          </Field>
          <Field label="Тип">
            <Segmented
              value={section.mediaType}
              onChange={(v) => onPatch((s) => ({ ...s, mediaType: v }))}
              options={[
                { value: 'image' as const, label: 'Картинка' },
                { value: 'video' as const, label: 'Видео' },
              ]}
            />
          </Field>
          <Field label="Заполнение">
            <Segmented
              value={section.mediaFit}
              onChange={(v) => onPatch((s) => ({ ...s, mediaFit: v }))}
              options={[
                { value: 'cover' as const, label: 'Обрезать' },
                { value: 'contain' as const, label: 'Целиком' },
              ]}
            />
          </Field>
          {section.mediaUrl.trim() && (
            <div className="overflow-hidden rounded-xl border border-border">
              {section.mediaType === 'video' ? (
                <video src={section.mediaUrl} className="h-28 w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={section.mediaUrl} alt="" className="h-28 w-full object-cover" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Текст */}
      {section.kind === 'text' && (
        <Field label="Текст">
          <textarea
            value={section.text}
            onChange={(e) => onPatch((s) => ({ ...s, text: e.target.value }))}
            rows={4}
            placeholder="Например: Скидка 20 % на все лимонады до 15:00"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </Field>
      )}

      {/* Оформление секции */}
      <div className="mt-3 space-y-3 border-t border-border pt-3">
        <Toggle
          label="Рамка и фон секции"
          checked={section.showFrame}
          onChange={(v) => onPatch((s) => ({ ...s, showFrame: v }))}
        />
        {section.kind !== 'media' && (
          <Field label="Заливка секции">
            <ColorPicker
              value={section.background}
              presets={SECTION_BG_PRESETS}
              allowEmpty
              onChange={(v) => onPatch((s) => ({ ...s, background: v }))}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

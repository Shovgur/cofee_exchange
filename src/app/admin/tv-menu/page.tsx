'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Monitor,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  Palette,
  Wand2,
  Copy,
} from 'lucide-react';
import { usePrices } from '@/contexts/PricesContext';
import { useCountry } from '@/contexts/CountryContext';
import Button from '@/components/ui/Button';
import TvMenuBoard from '@/components/tv-menu/TvMenuBoard';
import DrinkPicker from '@/components/admin/tv-menu/DrinkPicker';
import { fetchTvMenuConfig, saveTvMenuConfig } from '@/lib/tv-menu/api';
import {
  defaultTvMenuConfig,
  emptyScreen,
  emptySection,
  makeId,
  DEFAULT_ACCENT,
  type TvMenuConfig,
  type TvMenuScreen,
  type TvMenuSection,
} from '@/lib/tv-menu/config';
import {
  resolveScreens,
  CATEGORY_ORDER,
  CATEGORY_TITLE,
} from '@/lib/tv-menu/resolve';
import { cn } from '@/lib/utils';
import type { Drink } from '@/types';

const ACCENT_PRESETS = ['#E26402', '#C62828', '#15803D', '#1D4ED8', '#7C3AED', '#0F766E'];

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── Мелкие элементы формы ─────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted/80">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
    />
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-el"
    >
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'justify-end bg-orange' : 'justify-start bg-surface-ov',
        )}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </span>
    </button>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-ov p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
            value === o.value ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Секция ────────────────────────────────────────────────────────────────

function SectionCard({
  section,
  index,
  total,
  drinksById,
  onPatch,
  onRemove,
  onMove,
  onAddDrinks,
}: {
  section: TvMenuSection;
  index: number;
  total: number;
  drinksById: Map<string, Drink>;
  onPatch: (fn: (s: TvMenuSection) => TvMenuSection) => void;
  onRemove: () => void;
  onMove: (to: number) => void;
  onAddDrinks: () => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
        const isAll = allValues.every((v) => next.includes(v)) && next.length === allValues.length;
        return { ...item, volumes: isAll ? [] : next };
      }),
    }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <GripVertical size={16} className="shrink-0 text-muted" />
        <input
          type="text"
          value={section.title}
          onChange={(e) => onPatch((s) => ({ ...s, title: e.target.value }))}
          placeholder="Заголовок секции"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-border focus:border-orange/50 focus:outline-none"
        />
        <select
          value={section.columns ?? ''}
          onChange={(e) =>
            onPatch((s) => ({ ...s, columns: e.target.value ? Number(e.target.value) : null }))
          }
          className="form-select !h-8 !w-auto !pl-2 !pr-7 !text-xs"
          title="Колонок в секции"
        >
          <option value="">Общие</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} кол.</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onMove(index - 1)}
          disabled={index === 0}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-el hover:text-foreground disabled:opacity-30"
          title="Выше"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index + 1)}
          disabled={index === total - 1}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-el hover:text-foreground disabled:opacity-30"
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
                  {drink?.name ?? 'Нет на доске'}
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted transition-colors hover:border-orange/50 hover:text-orange"
      >
        <Plus size={14} /> Добавить напитки
      </button>
    </div>
  );
}

// ── Страница ──────────────────────────────────────────────────────────────

export default function AdminTvMenuPage() {
  const { drinks, loading: pricesLoading, error: pricesError, secondsUntilNextPoll } = usePrices();
  const { country } = useCountry();

  const [config, setConfig] = useState<TvMenuConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'screens' | 'design'>('screens');
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchTvMenuConfig()
      .then((c) => {
        setConfig(c);
        setActiveScreenId(c.screens[0]?.id ?? null);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки конфига');
        setConfig(defaultTvMenuConfig());
      });
  }, []);

  const drinksById = useMemo(() => new Map(drinks.map((d) => [d.id, d])), [drinks]);

  const patch = useCallback((fn: (c: TvMenuConfig) => TvMenuConfig) => {
    setConfig((prev) => (prev ? fn(prev) : prev));
    setDirty(true);
  }, []);

  const patchScreen = useCallback(
    (screenId: string, fn: (s: TvMenuScreen) => TvMenuScreen) =>
      patch((c) => ({
        ...c,
        screens: c.screens.map((s) => (s.id === screenId ? fn(s) : s)),
      })),
    [patch],
  );

  const activeScreen = config?.screens.find((s) => s.id === activeScreenId) ?? null;

  const previewScreens = useMemo(
    () => (config ? resolveScreens(config, drinks) : []),
    [config, drinks],
  );

  const previewScreen = useMemo(() => {
    if (!config) return undefined;
    if (config.screens.length === 0) return previewScreens[0];
    const idx = config.screens.findIndex((s) => s.id === activeScreenId);
    return previewScreens[idx >= 0 ? idx : 0];
  }, [config, previewScreens, activeScreenId]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { config: saved, persisted } = await saveTvMenuConfig(config);
      setConfig(saved);
      setDirty(false);
      showToast(
        persisted
          ? 'Меню сохранено — телевизоры подхватят за 20 секунд'
          : 'Сохранено только в памяти сервера: файл конфига недоступен для записи',
        persisted,
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка сохранения', false);
    } finally {
      setSaving(false);
    }
  };

  /** Собирает экран из текущей доски: по секции на категорию. */
  const generateFromBoard = () => {
    const sections: TvMenuSection[] = [];
    for (const category of CATEGORY_ORDER) {
      const items = drinks
        .filter((d) => d.category === category)
        .map((d) => ({ drinkId: d.id, volumes: [] as string[] }));
      if (items.length === 0) continue;
      sections.push({
        id: makeId('sec'),
        title: CATEGORY_TITLE[category],
        columns: null,
        items,
      });
    }
    const screen: TvMenuScreen = { id: makeId('scr'), title: 'Основное меню', sections };
    patch((c) => ({ ...c, screens: [...c.screens, screen] }));
    setActiveScreenId(screen.id);
  };

  const addScreen = () => {
    const screen = emptyScreen(`Экран ${(config?.screens.length ?? 0) + 1}`);
    patch((c) => ({ ...c, screens: [...c.screens, screen] }));
    setActiveScreenId(screen.id);
  };

  const duplicateScreen = (screen: TvMenuScreen) => {
    const copy: TvMenuScreen = {
      id: makeId('scr'),
      title: `${screen.title} (копия)`,
      sections: screen.sections.map((s) => ({ ...s, id: makeId('sec'), items: [...s.items] })),
    };
    patch((c) => ({ ...c, screens: [...c.screens, copy] }));
    setActiveScreenId(copy.id);
  };

  const removeScreen = (screenId: string) => {
    patch((c) => {
      const screens = c.screens.filter((s) => s.id !== screenId);
      setActiveScreenId(screens[0]?.id ?? null);
      return { ...c, screens };
    });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  const pickerSection = activeScreen?.sections.find((s) => s.id === pickerSectionId) ?? null;

  return (
    <>
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
          toast.ok ? 'bg-green-500' : 'bg-danger',
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="p-8">
        {/* Шапка */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-2xl font-bold">Конструктор ТВ-меню</h1>
            <p className="text-sm text-muted">
              Цены всегда живые с биржи — здесь настраивается только состав и оформление
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/tv-menu"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <ExternalLink size={16} /> Открыть экран
            </a>
            <Button
              variant="secondary"
              onClick={() => {
                setConfig(defaultTvMenuConfig());
                setActiveScreenId(null);
                setDirty(true);
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw size={16} /> Сбросить
            </Button>
            <Button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {dirty ? 'Сохранить' : 'Сохранено'}
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertTriangle size={16} /> {loadError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Левая колонка — настройки */}
          <div className="space-y-4">
            <div className="flex gap-1 rounded-xl bg-surface-ov p-1">
              {([
                { id: 'screens', label: 'Экраны и позиции', icon: LayoutGrid },
                { id: 'design', label: 'Оформление', icon: Palette },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
                    tab === t.id ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground',
                  )}
                >
                  <t.icon size={15} /> {t.label}
                </button>
              ))}
            </div>

            {tab === 'screens' && (
              <div className="space-y-4">
                {config.screens.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
                    <Monitor size={32} strokeWidth={1.2} className="mx-auto mb-3 text-muted" />
                    <p className="mb-1 text-sm font-medium">Экраны не настроены</p>
                    <p className="mb-4 text-xs text-muted">
                      Сейчас телевизор показывает всю доску, разбитую по категориям.
                      Создайте экран, чтобы управлять составом вручную.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button onClick={generateFromBoard} className="flex items-center justify-center gap-2">
                        <Wand2 size={16} /> Собрать из текущей доски
                      </Button>
                      <Button variant="secondary" onClick={addScreen} className="flex items-center justify-center gap-2">
                        <Plus size={16} /> Пустой экран
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Переключатель экранов */}
                    <div className="rounded-2xl border border-border bg-surface p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Экраны
                        </span>
                        <button
                          type="button"
                          onClick={addScreen}
                          className="flex items-center gap-1 text-xs font-medium text-orange hover:underline"
                        >
                          <Plus size={13} /> Добавить
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {config.screens.map((s, i) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveScreenId(s.id)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                              s.id === activeScreenId
                                ? 'border-orange bg-orange/10 text-orange'
                                : 'border-border text-muted hover:text-foreground',
                            )}
                          >
                            {i + 1}. {s.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeScreen && (
                      <>
                        <div className="rounded-2xl border border-border bg-surface p-4">
                          <Field label="Название экрана">
                            <div className="flex gap-2">
                              <TextInput
                                value={activeScreen.title}
                                onChange={(v) =>
                                  patchScreen(activeScreen.id, (s) => ({ ...s, title: v }))
                                }
                              />
                              <button
                                type="button"
                                onClick={() => duplicateScreen(activeScreen)}
                                className="shrink-0 rounded-xl border border-border px-3 text-muted transition-colors hover:text-foreground"
                                title="Дублировать экран"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeScreen(activeScreen.id)}
                                className="shrink-0 rounded-xl border border-border px-3 text-muted transition-colors hover:border-danger/40 hover:text-danger"
                                title="Удалить экран"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </Field>
                        </div>

                        {activeScreen.sections.map((section, i) => (
                          <SectionCard
                            key={section.id}
                            section={section}
                            index={i}
                            total={activeScreen.sections.length}
                            drinksById={drinksById}
                            onPatch={(fn) =>
                              patchScreen(activeScreen.id, (s) => ({
                                ...s,
                                sections: s.sections.map((x) => (x.id === section.id ? fn(x) : x)),
                              }))
                            }
                            onRemove={() =>
                              patchScreen(activeScreen.id, (s) => ({
                                ...s,
                                sections: s.sections.filter((x) => x.id !== section.id),
                              }))
                            }
                            onMove={(to) =>
                              patchScreen(activeScreen.id, (s) => ({
                                ...s,
                                sections: move(s.sections, i, to),
                              }))
                            }
                            onAddDrinks={() => setPickerSectionId(section.id)}
                          />
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            patchScreen(activeScreen.id, (s) => ({
                              ...s,
                              sections: [...s.sections, emptySection()],
                            }))
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted transition-colors hover:border-orange/50 hover:text-orange"
                        >
                          <Plus size={16} /> Добавить секцию
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === 'design' && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Шапка</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Название">
                      <TextInput
                        value={config.header.title}
                        onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, title: v } }))}
                      />
                    </Field>
                    <Field label="Акцентное слово">
                      <TextInput
                        value={config.header.accentWord}
                        onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, accentWord: v } }))}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-[1fr_88px] gap-3">
                    <Field label="Подпись">
                      <TextInput
                        value={config.header.subtitle}
                        onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, subtitle: v } }))}
                      />
                    </Field>
                    <Field label="Иконка">
                      <TextInput
                        value={config.header.logoEmoji}
                        onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, logoEmoji: v } }))}
                      />
                    </Field>
                  </div>
                  <Toggle
                    label="Часы и дата"
                    checked={config.header.showClock}
                    onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, showClock: v } }))}
                  />
                  <Toggle
                    label="Плашка обновления цен"
                    checked={config.header.showRefreshBanner}
                    onChange={(v) => patch((c) => ({ ...c, header: { ...c.header, showRefreshBanner: v } }))}
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Сетка</h3>
                  <Field label="Колонок по умолчанию">
                    <Segmented
                      value={config.layout.columns}
                      onChange={(v) => patch((c) => ({ ...c, layout: { ...c.layout, columns: v } }))}
                      options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                    />
                  </Field>
                  <Field label="Плотность">
                    <Segmented
                      value={config.layout.density}
                      onChange={(v) => patch((c) => ({ ...c, layout: { ...c.layout, density: v } }))}
                      options={[
                        { value: 'compact' as const, label: 'Плотно' },
                        { value: 'normal' as const, label: 'Обычно' },
                        { value: 'spacious' as const, label: 'Просторно' },
                      ]}
                    />
                  </Field>
                  <Field label={`Размер шрифта · ${Math.round(config.layout.fontScale * 100)}%`}>
                    <input
                      type="range"
                      min={70}
                      max={160}
                      step={5}
                      value={Math.round(config.layout.fontScale * 100)}
                      onChange={(e) =>
                        patch((c) => ({
                          ...c,
                          layout: { ...c.layout, fontScale: Number(e.target.value) / 100 },
                        }))
                      }
                      className="w-full accent-orange"
                    />
                  </Field>
                  <Toggle
                    label="Фотографии напитков"
                    checked={config.layout.showPhotos}
                    onChange={(v) => patch((c) => ({ ...c, layout: { ...c.layout, showPhotos: v } }))}
                  />
                  <Toggle
                    label="Цена в Бинах"
                    checked={config.layout.showBeanPrices}
                    onChange={(v) => patch((c) => ({ ...c, layout: { ...c.layout, showBeanPrices: v } }))}
                  />
                  <Toggle
                    label="Стрелки роста и падения"
                    checked={config.layout.showTrends}
                    onChange={(v) => patch((c) => ({ ...c, layout: { ...c.layout, showTrends: v } }))}
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Тема</h3>
                  <Field label="Фон">
                    <Segmented
                      value={config.theme.background}
                      onChange={(v) => patch((c) => ({ ...c, theme: { ...c.theme, background: v } }))}
                      options={[
                        { value: 'dark' as const, label: 'Тёмный' },
                        { value: 'light' as const, label: 'Светлый' },
                      ]}
                    />
                  </Field>
                  <Field label="Акцентный цвет">
                    <div className="flex items-center gap-2">
                      {ACCENT_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => patch((c) => ({ ...c, theme: { ...c.theme, accent: color } }))}
                          className={cn(
                            'h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110',
                            config.theme.accent.toUpperCase() === color
                              ? 'border-foreground'
                              : 'border-transparent',
                          )}
                          style={{ background: color }}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={config.theme.accent}
                        onChange={(e) =>
                          patch((c) => ({ ...c, theme: { ...c.theme, accent: e.target.value } }))
                        }
                        className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-surface"
                        title="Свой цвет"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patch((c) => ({ ...c, theme: { ...c.theme, accent: DEFAULT_ACCENT } }))
                        }
                        className="ml-auto text-xs text-muted hover:text-foreground"
                      >
                        Сброс
                      </button>
                    </div>
                  </Field>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Ротация экранов
                  </h3>
                  <Toggle
                    label="Переключать автоматически"
                    checked={config.rotation.enabled}
                    onChange={(v) => patch((c) => ({ ...c, rotation: { ...c.rotation, enabled: v } }))}
                  />
                  {config.rotation.enabled && (
                    <Field label={`Интервал · ${config.rotation.intervalSec} сек`}>
                      <input
                        type="range"
                        min={5}
                        max={120}
                        step={5}
                        value={config.rotation.intervalSec}
                        onChange={(e) =>
                          patch((c) => ({
                            ...c,
                            rotation: { ...c.rotation, intervalSec: Number(e.target.value) },
                          }))
                        }
                        className="w-full accent-orange"
                      />
                    </Field>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Бегущая строка
                  </h3>
                  <Toggle
                    label="Показывать"
                    checked={config.ticker.enabled}
                    onChange={(v) => patch((c) => ({ ...c, ticker: { ...c.ticker, enabled: v } }))}
                  />
                  {config.ticker.enabled && (
                    <>
                      <Field label="Текст">
                        <TextInput
                          value={config.ticker.text}
                          onChange={(v) => patch((c) => ({ ...c, ticker: { ...c.ticker, text: v } }))}
                          placeholder="Сегодня скидка на раф до 14:00"
                        />
                      </Field>
                      <Field label={`Скорость · ${config.ticker.speedSec} сек на проход`}>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          step={5}
                          value={config.ticker.speedSec}
                          onChange={(e) =>
                            patch((c) => ({
                              ...c,
                              ticker: { ...c.ticker, speedSec: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-orange"
                        />
                      </Field>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <Field label="Текст в подвале">
                    <TextInput
                      value={config.footer}
                      onChange={(v) => patch((c) => ({ ...c, footer: v }))}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка — превью */}
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Предпросмотр 16:9
              </span>
              {dirty && (
                <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                  Есть несохранённые изменения
                </span>
              )}
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-lg">
              <TvMenuBoard
                config={config}
                screen={previewScreen}
                country={country}
                loading={pricesLoading}
                error={pricesError}
                secondsUntilNextPoll={secondsUntilNextPoll}
                screenCount={Math.max(1, config.screens.length)}
                screenIndex={Math.max(0, config.screens.findIndex((s) => s.id === activeScreenId))}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Телевизор перечитывает настройки каждые 20 секунд после сохранения.
              Цены обновляются независимо, вместе с биржей.
            </p>
          </div>
        </div>
      </div>

      <DrinkPicker
        open={pickerSection !== null}
        onClose={() => setPickerSectionId(null)}
        drinks={drinks}
        alreadyAdded={pickerSection?.items.map((i) => i.drinkId) ?? []}
        onConfirm={(ids) => {
          if (!activeScreen || !pickerSection) return;
          patchScreen(activeScreen.id, (s) => ({
            ...s,
            sections: s.sections.map((sec) =>
              sec.id === pickerSection.id
                ? { ...sec, items: [...sec.items, ...ids.map((id) => ({ drinkId: id, volumes: [] }))] }
                : sec,
            ),
          }));
        }}
      />
    </>
  );
}

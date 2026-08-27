'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Monitor,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  Palette,
  Wand2,
  Copy,
  Ruler,
} from 'lucide-react';
import { usePrices } from '@/contexts/PricesContext';
import { useCountry } from '@/contexts/CountryContext';
import Button from '@/components/ui/Button';
import TvMenuBoard from '@/components/tv-menu/TvMenuBoard';
import DrinkPicker from '@/components/admin/tv-menu/DrinkPicker';
import LayoutCanvas from '@/components/admin/tv-menu/LayoutCanvas';
import SectionEditor from '@/components/admin/tv-menu/SectionEditor';
import {
  Field,
  Segmented,
  Slider,
  TextInput,
  Toggle,
  ColorPicker,
} from '@/components/admin/tv-menu/controls';
import { fetchTvMenuDocument, saveTvMenuDocument } from '@/lib/tv-menu/api';
import {
  boardHeightCm,
  boardWidthCm,
  emptyScreen,
  emptySection,
  makeId,
  DEFAULT_ACCENT,
  GRID_COLUMNS,
  GRID_ROWS,
  type TvBoardConfig,
  type TvGridRect,
  type TvMenuDocument,
  type TvMenuScreen,
  type TvMenuSection,
} from '@/lib/tv-menu/config';
import { resolveScreens, CATEGORY_ORDER, CATEGORY_TITLE } from '@/lib/tv-menu/resolve';
import { cn } from '@/lib/utils';

const ACCENT_PRESETS = ['#E26402', '#C62828', '#15803D', '#1D4ED8', '#7C3AED', '#0F766E'];
const BG_PRESETS = ['#14100D', '#1B1410', '#0B1220', '#F0E4D8', '#FFFFFF'];

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Ищет свободную строку под новую секцию, чтобы блоки не наложились. */
function nextFreeRect(sections: TvMenuSection[]): TvGridRect {
  const defaultHeight = Math.round(GRID_ROWS / 3);
  const bottom = sections.reduce((max, s) => Math.max(max, s.rect.y + s.rect.h), 0);
  const y = Math.min(bottom, GRID_ROWS - 2);
  return { x: 0, y, w: GRID_COLUMNS, h: Math.min(defaultHeight, GRID_ROWS - y) };
}

export default function AdminTvMenuBoardPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const router = useRouter();
  const { drinks, loading: pricesLoading, error: pricesError, secondsUntilNextPoll } = usePrices();
  const { country } = useCountry();

  const [doc, setDoc] = useState<TvMenuDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'screens' | 'design'>('screens');
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchTvMenuDocument()
      .then((d) => {
        setDoc(d);
        const board = d.boards.find((b) => b.id === boardId);
        setActiveScreenId(board?.screens[0]?.id ?? null);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Ошибка загрузки конфига'));
  }, [boardId]);

  const board = doc?.boards.find((b) => b.id === boardId) ?? null;
  const drinksById = useMemo(() => new Map(drinks.map((d) => [d.id, d])), [drinks]);

  const patchBoard = useCallback(
    (fn: (b: TvBoardConfig) => TvBoardConfig) => {
      setDoc((prev) =>
        prev
          ? { ...prev, boards: prev.boards.map((b) => (b.id === boardId ? fn(b) : b)) }
          : prev,
      );
      setDirty(true);
    },
    [boardId],
  );

  const patchScreen = useCallback(
    (screenId: string, fn: (s: TvMenuScreen) => TvMenuScreen) =>
      patchBoard((b) => ({
        ...b,
        screens: b.screens.map((s) => (s.id === screenId ? fn(s) : s)),
      })),
    [patchBoard],
  );

  const activeScreen = board?.screens.find((s) => s.id === activeScreenId) ?? null;

  const previewScreens = useMemo(
    () => (board ? resolveScreens(board, drinks) : []),
    [board, drinks],
  );

  const previewScreen = useMemo(() => {
    if (!board) return undefined;
    if (board.screens.length === 0) return previewScreens[0];
    const idx = board.screens.findIndex((s) => s.id === activeScreenId);
    return previewScreens[idx >= 0 ? idx : 0];
  }, [board, previewScreens, activeScreenId]);

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const { doc: saved, persisted } = await saveTvMenuDocument(doc);
      setDoc(saved);
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

  /** Собирает экран из текущей биржи: по секции на категорию, друг под другом. */
  const generateFromBoard = () => {
    const sections: TvMenuSection[] = [];
    let y = 0;
    for (const category of CATEGORY_ORDER) {
      const items = drinks
        .filter((d) => d.category === category)
        .map((d) => ({ drinkId: d.id, volumes: [] as string[] }));
      if (items.length === 0) continue;

      const rows = Math.ceil(items.length / 3) * 4 + 2;
      const h = Math.max(4, Math.min(GRID_ROWS - y, rows));
      const section = emptySection(CATEGORY_TITLE[category], { x: 0, y, w: GRID_COLUMNS, h });
      section.columns = 3;
      section.items = items;
      y = Math.min(GRID_ROWS - 1, y + h);
      sections.push(section);
    }
    const screen: TvMenuScreen = { id: makeId('scr'), title: 'Основное меню', sections };
    patchBoard((b) => ({ ...b, screens: [...b.screens, screen] }));
    setActiveScreenId(screen.id);
  };

  const addScreen = () => {
    const screen = emptyScreen(`Экран ${(board?.screens.length ?? 0) + 1}`);
    patchBoard((b) => ({ ...b, screens: [...b.screens, screen] }));
    setActiveScreenId(screen.id);
  };

  const duplicateScreen = (screen: TvMenuScreen) => {
    const copy: TvMenuScreen = {
      id: makeId('scr'),
      title: `${screen.title} (копия)`,
      sections: screen.sections.map((s) => ({ ...s, id: makeId('sec') })),
    };
    patchBoard((b) => ({ ...b, screens: [...b.screens, copy] }));
    setActiveScreenId(copy.id);
  };

  const removeScreen = (screenId: string) => {
    patchBoard((b) => {
      const screens = b.screens.filter((s) => s.id !== screenId);
      setActiveScreenId(screens[0]?.id ?? null);
      return { ...b, screens };
    });
  };

  const addSection = () => {
    if (!activeScreen) return;
    const section = emptySection('Новая секция', nextFreeRect(activeScreen.sections));
    patchScreen(activeScreen.id, (s) => ({ ...s, sections: [...s.sections, section] }));
    setSelectedSectionId(section.id);
  };

  if (!doc && !loadError) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/admin/tv-menu')}
          className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> К списку досок
        </button>
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError ?? 'Доска не найдена'}
        </div>
      </div>
    );
  }

  const pickerSection = activeScreen?.sections.find((s) => s.id === pickerSectionId) ?? null;
  const isPortrait = board.layout.orientation === 'portrait';
  const areaW = Math.round(
    boardWidthCm(board.layout.screenDiagonalCm, board.layout.orientation),
  );
  const areaH = Math.round(
    boardHeightCm(board.layout.screenDiagonalCm, board.layout.orientation),
  );

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
        <button
          onClick={() => router.push('/admin/tv-menu')}
          className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> К списку досок
        </button>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <input
              type="text"
              value={board.name}
              onChange={(e) => patchBoard((b) => ({ ...b, name: e.target.value }))}
              className="w-full max-w-md rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold hover:border-border focus:border-orange/50 focus:outline-none"
            />
            <p className="px-2 text-sm text-muted">
              Ссылка для телевизора: <code className="text-xs">/tv-menu/{board.id}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/tv-menu/${board.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <ExternalLink size={16} /> Открыть экран
            </a>
            <Button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {dirty ? 'Сохранить' : 'Сохранено'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          {/* Левая колонка — настройки */}
          <div className="space-y-4">
            <div className="flex gap-1 rounded-xl bg-surface-ov p-1">
              {([
                { id: 'screens', label: 'Экраны и секции', icon: LayoutGrid },
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
                {board.screens.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
                    <Monitor size={32} strokeWidth={1.2} className="mx-auto mb-3 text-muted" />
                    <p className="mb-1 text-sm font-medium">Экраны не настроены</p>
                    <p className="mb-4 text-xs text-muted">
                      Сейчас телевизор показывает всю биржу, разбитую по категориям.
                      Создайте экран, чтобы управлять составом и раскладкой вручную.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button onClick={generateFromBoard} className="flex items-center justify-center gap-2">
                        <Wand2 size={16} /> Собрать из текущей биржи
                      </Button>
                      <Button variant="secondary" onClick={addScreen} className="flex items-center justify-center gap-2">
                        <Plus size={16} /> Пустой экран
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                        {board.screens.map((s, i) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setActiveScreenId(s.id); setSelectedSectionId(null); }}
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
                                onChange={(v) => patchScreen(activeScreen.id, (s) => ({ ...s, title: v }))}
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
                          <SectionEditor
                            key={section.id}
                            section={section}
                            index={i}
                            total={activeScreen.sections.length}
                            drinks={drinks}
                            drinksById={drinksById}
                            selected={selectedSectionId === section.id}
                            onSelect={() => setSelectedSectionId(section.id)}
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
                          onClick={addSection}
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
                  <Toggle
                    label="Показывать шапку"
                    checked={board.header.enabled}
                    onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, enabled: v } }))}
                  />
                  {!board.header.enabled && (
                    <p className="rounded-xl bg-surface-el px-3 py-2 text-[11px] text-muted">
                      Шапка скрыта — секции начинаются от самого верха экрана.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Название">
                      <TextInput
                        value={board.header.title}
                        onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, title: v } }))}
                      />
                    </Field>
                    <Field label="Акцентное слово">
                      <TextInput
                        value={board.header.accentWord}
                        onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, accentWord: v } }))}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-[1fr_88px] gap-3">
                    <Field label="Подпись">
                      <TextInput
                        value={board.header.subtitle}
                        onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, subtitle: v } }))}
                      />
                    </Field>
                    <Field label="Иконка">
                      <TextInput
                        value={board.header.logoEmoji}
                        onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, logoEmoji: v } }))}
                      />
                    </Field>
                  </div>
                  <Toggle
                    label="Часы и дата"
                    checked={board.header.showClock}
                    onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, showClock: v } }))}
                  />
                  <Toggle
                    label="Страна в подписи"
                    checked={board.header.showCountry}
                    onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, showCountry: v } }))}
                  />
                  <Toggle
                    label="Плашка обновления цен"
                    checked={board.header.showRefreshBanner}
                    onChange={(v) => patchBoard((b) => ({ ...b, header: { ...b.header, showRefreshBanner: v } }))}
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    <Ruler size={13} /> Экран и масштаб
                  </h3>
                  <Field
                    label="Ориентация"
                    hint="Для телевизора, повёрнутого вертикально, раскладка и предпросмотр становятся 9:16."
                  >
                    <Segmented
                      value={board.layout.orientation}
                      onChange={(v) =>
                        patchBoard((b) => ({ ...b, layout: { ...b.layout, orientation: v } }))
                      }
                      options={[
                        { value: 'landscape' as const, label: 'Горизонтально' },
                        { value: 'portrait' as const, label: 'Вертикально' },
                      ]}
                    />
                  </Field>
                  <Field
                    label={`Диагональ телевизора · ${board.layout.screenDiagonalCm} см`}
                    hint={`Рабочая область ${areaW} × ${areaH} см. Размеры надписей заданы в сантиметрах и от диагонали не зависят: чем больше экран, тем больше места и позиций.`}
                  >
                    <Slider
                      value={board.layout.screenDiagonalCm}
                      min={40}
                      max={300}
                      step={5}
                      onChange={(v) =>
                        patchBoard((b) => ({ ...b, layout: { ...b.layout, screenDiagonalCm: v } }))
                      }
                    />
                  </Field>
                  <Field
                    label={`Масштаб содержимого · ${Math.round(board.layout.fontScale * 100)}%`}
                    hint="100 % — размер 1:1. Меняйте, только если хочется крупнее или мельче: диагональ трогать для этого не нужно."
                  >
                    <Slider
                      value={Math.round(board.layout.fontScale * 100)}
                      min={40}
                      max={200}
                      step={5}
                      onChange={(v) =>
                        patchBoard((b) => ({ ...b, layout: { ...b.layout, fontScale: v / 100 } }))
                      }
                    />
                  </Field>
                  <Field
                    label={`Поля по краям · ${board.layout.paddingCm} см`}
                    hint="0 — содержимое вплотную к углам экрана, без пустых зон."
                  >
                    <Slider
                      value={board.layout.paddingCm}
                      min={0}
                      max={6}
                      step={0.5}
                      onChange={(v) =>
                        patchBoard((b) => ({ ...b, layout: { ...b.layout, paddingCm: v } }))
                      }
                    />
                  </Field>
                  <Field label="Плотность">
                    <Segmented
                      value={board.layout.density}
                      onChange={(v) => patchBoard((b) => ({ ...b, layout: { ...b.layout, density: v } }))}
                      options={[
                        { value: 'compact' as const, label: 'Плотно' },
                        { value: 'normal' as const, label: 'Обычно' },
                        { value: 'spacious' as const, label: 'Просторно' },
                      ]}
                    />
                  </Field>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Что показывать у цены
                  </h3>
                  <Toggle
                    label="Фотографии напитков"
                    checked={board.layout.showPhotos}
                    onChange={(v) => patchBoard((b) => ({ ...b, layout: { ...b.layout, showPhotos: v } }))}
                  />
                  <Toggle
                    label="Процент изменения (362 ₽ −18 %)"
                    checked={board.layout.showPercent}
                    onChange={(v) => patchBoard((b) => ({ ...b, layout: { ...b.layout, showPercent: v } }))}
                  />
                  <Toggle
                    label="Стрелки роста и падения"
                    checked={board.layout.showTrends}
                    onChange={(v) => patchBoard((b) => ({ ...b, layout: { ...b.layout, showTrends: v } }))}
                  />
                  <Toggle
                    label="Цена в Бинах"
                    checked={board.layout.showBeanPrices}
                    onChange={(v) => patchBoard((b) => ({ ...b, layout: { ...b.layout, showBeanPrices: v } }))}
                  />
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Фон и цвета</h3>
                  <Field label="Базовая тема">
                    <Segmented
                      value={board.theme.background}
                      onChange={(v) => patchBoard((b) => ({ ...b, theme: { ...b.theme, background: v } }))}
                      options={[
                        { value: 'dark' as const, label: 'Тёмная' },
                        { value: 'light' as const, label: 'Светлая' },
                      ]}
                    />
                  </Field>
                  <Field label="Цвет фона экрана">
                    <ColorPicker
                      value={board.theme.customBg}
                      presets={BG_PRESETS}
                      allowEmpty
                      onChange={(v) => patchBoard((b) => ({ ...b, theme: { ...b.theme, customBg: v } }))}
                    />
                  </Field>
                  <Field label="Акцентный цвет">
                    <ColorPicker
                      value={board.theme.accent}
                      presets={ACCENT_PRESETS}
                      onChange={(v) =>
                        patchBoard((b) => ({ ...b, theme: { ...b.theme, accent: v ?? DEFAULT_ACCENT } }))
                      }
                    />
                  </Field>
                  <Field label="Фоновая картинка" hint="Прямая ссылка на изображение">
                    <TextInput
                      value={board.theme.bgImageUrl}
                      onChange={(v) => patchBoard((b) => ({ ...b, theme: { ...b.theme, bgImageUrl: v } }))}
                      placeholder="https://…/background.jpg"
                    />
                  </Field>
                  {board.theme.bgImageUrl.trim() && (
                    <Field label={`Затемнение фона · ${board.theme.bgDim} %`}>
                      <Slider
                        value={board.theme.bgDim}
                        min={0}
                        max={90}
                        step={5}
                        onChange={(v) => patchBoard((b) => ({ ...b, theme: { ...b.theme, bgDim: v } }))}
                      />
                    </Field>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Ротация экранов
                  </h3>
                  <Toggle
                    label="Переключать автоматически"
                    checked={board.rotation.enabled}
                    onChange={(v) => patchBoard((b) => ({ ...b, rotation: { ...b.rotation, enabled: v } }))}
                  />
                  {board.rotation.enabled && (
                    <Field label={`Интервал · ${board.rotation.intervalSec} сек`}>
                      <Slider
                        value={board.rotation.intervalSec}
                        min={5}
                        max={120}
                        step={5}
                        onChange={(v) =>
                          patchBoard((b) => ({ ...b, rotation: { ...b.rotation, intervalSec: v } }))
                        }
                      />
                    </Field>
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Бегущая строка
                  </h3>
                  <p className="text-[11px] text-muted">
                    Действует только на этой доске — на других она своя.
                  </p>
                  <Toggle
                    label="Показывать"
                    checked={board.ticker.enabled}
                    onChange={(v) => patchBoard((b) => ({ ...b, ticker: { ...b.ticker, enabled: v } }))}
                  />
                  {board.ticker.enabled && (
                    <>
                      <Field label="Текст">
                        <TextInput
                          value={board.ticker.text}
                          onChange={(v) => patchBoard((b) => ({ ...b, ticker: { ...b.ticker, text: v } }))}
                          placeholder="Сегодня скидка на раф до 14:00"
                        />
                      </Field>
                      <Field label={`Скорость · ${board.ticker.speedSec} сек на проход`}>
                        <Slider
                          value={board.ticker.speedSec}
                          min={10}
                          max={90}
                          step={5}
                          onChange={(v) =>
                            patchBoard((b) => ({ ...b, ticker: { ...b.ticker, speedSec: v } }))
                          }
                        />
                      </Field>
                    </>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <Field label="Текст в подвале" hint="Оставьте пустым, чтобы убрать подвал">
                    <TextInput
                      value={board.footer}
                      onChange={(v) => patchBoard((b) => ({ ...b, footer: v }))}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка — схема раскладки и превью */}
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            {activeScreen && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Раскладка — тяните блоки и уголок для размера
                  </span>
                  <span className="text-[11px] text-muted">
                    сетка {GRID_COLUMNS}×{GRID_ROWS}
                  </span>
                </div>
                <LayoutCanvas
                  sections={activeScreen.sections}
                  selectedId={selectedSectionId}
                  orientation={board.layout.orientation}
                  onSelect={setSelectedSectionId}
                  onRectChange={(id, rect) =>
                    patchScreen(activeScreen.id, (s) => ({
                      ...s,
                      sections: s.sections.map((x) => (x.id === id ? { ...x, rect } : x)),
                    }))
                  }
                />
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Предпросмотр · {areaW} × {areaH} см
                </span>
                {dirty && (
                  <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                    Есть несохранённые изменения
                  </span>
                )}
              </div>
              <div
                className={cn(
                  'w-full overflow-hidden rounded-2xl border border-border shadow-lg',
                  isPortrait ? 'mx-auto aspect-[9/16] max-w-sm' : 'aspect-video',
                )}
              >
                <TvMenuBoard
                  board={board}
                  screen={previewScreen}
                  country={country}
                  loading={pricesLoading}
                  error={pricesError}
                  secondsUntilNextPoll={secondsUntilNextPoll}
                  screenCount={Math.max(1, board.screens.length)}
                  screenIndex={Math.max(0, board.screens.findIndex((s) => s.id === activeScreenId))}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Телевизор перечитывает настройки каждые 20 секунд после сохранения.
                Цены обновляются независимо, вместе с биржей.
              </p>
            </div>
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

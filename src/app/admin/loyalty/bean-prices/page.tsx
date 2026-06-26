'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Coffee,
  Loader2,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  adminGetItemBeanPrice,
  adminSetItemBeanPrice,
  adminGetModifierBeanPrice,
  adminSetModifierBeanPrice,
} from '@/lib/api/loyalty/admin';
import { fetchMenu, fetchMenuItem } from '@/lib/api/loyalty/catalog';
import type { ApiMenuItem, ApiMenuModifier } from '@/lib/api/loyalty/types';
import { useCountry } from '@/contexts/CountryContext';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

// ── Types ──────────────────────────────────────────────────────────────────

interface EditableRow {
  beanPrice: number | null;
  editing: boolean;
  editValue: string;
  saving: boolean;
}

interface ItemRow extends ApiMenuItem, EditableRow {
  modifiers?: ModifierRow[];
  modifiersLoaded?: boolean;
  modifiersOpen?: boolean;
}

interface ModifierRow extends ApiMenuModifier, EditableRow {}

// ── Inline price editor ────────────────────────────────────────────────────

function PriceCell({
  row,
  onEdit,
  onEditChange,
  onSave,
  size = 'md',
}: {
  row: EditableRow;
  onEdit: () => void;
  onEditChange: (val: string) => void;
  onSave: () => void;
  size?: 'sm' | 'md';
}) {
  const inputCls =
    size === 'sm'
      ? 'w-20 rounded-lg border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange/40 tabular-nums'
      : 'w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 tabular-nums';
  const btnCls =
    size === 'sm'
      ? 'flex h-6 w-6 items-center justify-center rounded-md bg-orange text-white hover:bg-orange/90 disabled:opacity-50 transition-colors'
      : 'flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white hover:bg-orange/90 disabled:opacity-50 transition-colors';
  const iconSize = size === 'sm' ? 11 : 14;

  if (row.editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={row.editValue}
          onChange={(e) => onEditChange(e.target.value)}
          className={inputCls}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
        />
        <button type="button" onClick={onSave} disabled={row.saving} className={btnCls}>
          {row.saving ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <Save size={iconSize} />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`flex items-center gap-1.5 rounded-lg border border-border bg-surface hover:bg-surface-el transition-colors ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      {row.beanPrice != null ? (
        <>
          <span className="tabular-nums font-medium">{row.beanPrice}</span>
          <CoffeeBeanIcon size={size === 'sm' ? 10 : 12} className="text-orange" />
        </>
      ) : (
        <span className="text-muted">— задать</span>
      )}
    </button>
  );
}

// ── Item row ───────────────────────────────────────────────────────────────

function ItemBeanPriceRow({
  item,
  onSave,
  onEdit,
  onEditChange,
  onModifierSave,
  onModifierEdit,
  onModifierEditChange,
  onToggleModifiers,
}: {
  item: ItemRow;
  onSave: (id: string) => void;
  onEdit: (id: string) => void;
  onEditChange: (id: string, val: string) => void;
  onModifierSave: (itemId: string, modId: string) => void;
  onModifierEdit: (itemId: string, modId: string) => void;
  onModifierEditChange: (itemId: string, modId: string, val: string) => void;
  onToggleModifiers: (id: string) => void;
}) {
  return (
    <div className="px-5 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted">{item.category ?? '—'} · {item.size_name ?? 'стд.'}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PriceCell
            row={item}
            onEdit={() => onEdit(item.id)}
            onEditChange={(v) => onEditChange(item.id, v)}
            onSave={() => onSave(item.id)}
          />

          {item.modifiers && item.modifiers.length > 0 && (
            <button
              type="button"
              onClick={() => onToggleModifiers(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-surface-el transition-colors"
            >
              {item.modifiersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Modifiers */}
      {item.modifiersOpen && item.modifiers && item.modifiers.length > 0 && (
        <div className="mt-3 ml-4 space-y-2">
          {item.modifiers.map((mod) => (
            <div key={mod.id} className="flex items-center gap-3">
              <p className="text-xs text-muted flex-1 truncate">+ {mod.name}</p>
              <PriceCell
                row={mod}
                onEdit={() => onModifierEdit(item.id, mod.id)}
                onEditChange={(v) => onModifierEditChange(item.id, mod.id, v)}
                onSave={() => onModifierSave(item.id, mod.id)}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminBeanPricesPage() {
  const { country } = useCountry();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, show: showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const menuItems = await fetchMenu(country.id);
      const rows: ItemRow[] = await Promise.all(
        menuItems.map(async (m) => {
          let beanPrice: number | null = null;
          try {
            const bp = await adminGetItemBeanPrice(m.id);
            beanPrice = bp.price_beans;
          } catch {
            beanPrice = m.price_beans;
          }
          return {
            ...m,
            beanPrice,
            editing: false,
            editValue: beanPrice != null ? String(beanPrice) : '',
            saving: false,
          };
        }),
      );
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [country.id]);

  useEffect(() => { void load(); }, [load]);

  // ── Item handlers ──────────────────────────────────────────────────────

  const handleEdit = (id: string) => {
    setItems((prev) => prev.map((it) =>
      it.id === id ? { ...it, editing: true } : { ...it, editing: false },
    ));
  };

  const handleEditChange = (id: string, val: string) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, editValue: val } : it));
  };

  const handleSave = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const price = parseInt(item.editValue, 10);
    if (!Number.isFinite(price) || price < 0) return;

    setItems((prev) => prev.map((it) => it.id === id ? { ...it, saving: true } : it));
    try {
      const res = await adminSetItemBeanPrice(id, price);
      setItems((prev) => prev.map((it) =>
        it.id === id ? { ...it, beanPrice: res.price_beans, editing: false, saving: false } : it,
      ));
      showToast(`Цена обновлена: ${res.price_beans} Б`, true);
    } catch (e) {
      setItems((prev) => prev.map((it) => it.id === id ? { ...it, saving: false } : it));
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    }
  };

  // ── Modifier handlers ──────────────────────────────────────────────────

  const patchModifier = (itemId: string, modId: string, patch: Partial<ModifierRow>) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== itemId || !it.modifiers) return it;
      return {
        ...it,
        modifiers: it.modifiers.map((m) => m.id === modId ? { ...m, ...patch } : m),
      };
    }));
  };

  const handleModifierEdit = (itemId: string, modId: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== itemId || !it.modifiers) return it;
      return {
        ...it,
        modifiers: it.modifiers.map((m) =>
          m.id === modId ? { ...m, editing: true } : { ...m, editing: false },
        ),
      };
    }));
  };

  const handleModifierEditChange = (itemId: string, modId: string, val: string) => {
    patchModifier(itemId, modId, { editValue: val });
  };

  const handleModifierSave = async (itemId: string, modId: string) => {
    const item = items.find((it) => it.id === itemId);
    const mod = item?.modifiers?.find((m) => m.id === modId);
    if (!mod) return;
    const price = parseInt(mod.editValue, 10);
    if (!Number.isFinite(price) || price < 0) return;

    patchModifier(itemId, modId, { saving: true });
    try {
      const res = await adminSetModifierBeanPrice(modId, price);
      patchModifier(itemId, modId, { beanPrice: res.price_beans, editing: false, saving: false });
      showToast(`Модификатор: ${res.price_beans} Б`, true);
    } catch (e) {
      patchModifier(itemId, modId, { saving: false });
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    }
  };

  // ── Load modifiers on expand ───────────────────────────────────────────

  const handleToggleModifiers = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    if (item.modifiersLoaded) {
      setItems((prev) => prev.map((it) =>
        it.id === id ? { ...it, modifiersOpen: !it.modifiersOpen } : it,
      ));
      return;
    }

    try {
      const detail = await fetchMenuItem(id);
      const modifiers: ModifierRow[] = await Promise.all(
        detail.modifiers.map(async (mod) => {
          let beanPrice: number | null = null;
          try {
            const bp = await adminGetModifierBeanPrice(mod.id);
            beanPrice = bp.price_beans;
          } catch {
            beanPrice = mod.price_beans;
          }
          return { ...mod, beanPrice, editing: false, editValue: '', saving: false };
        }),
      );
      setItems((prev) => prev.map((it) =>
        it.id === id ? { ...it, modifiers, modifiersLoaded: true, modifiersOpen: true } : it,
      ));
    } catch {
      showToast('Не удалось загрузить модификаторы', false);
    }
  };

  const grouped = items.reduce<Record<string, ItemRow[]>>((acc, item) => {
    const cat = item.category ?? 'Прочее';
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <Toast toast={toast} />

      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Coffee size={22} className="text-orange" />
              Цены в Бинах
            </h1>
            <p className="text-sm text-muted">
              Страна: <span className="font-medium">{country.name}</span> · нажмите на цену для редактирования
            </p>
          </div>
          <Button variant="secondary" onClick={load} loading={loading}>
            {!loading && <RefreshCw size={14} />}
            Обновить
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-muted" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, catItems]) => (
              <div key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2 px-1">{cat}</h2>
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  {catItems.map((item) => (
                    <ItemBeanPriceRow
                      key={item.id}
                      item={item}
                      onSave={handleSave}
                      onEdit={handleEdit}
                      onEditChange={handleEditChange}
                      onModifierSave={handleModifierSave}
                      onModifierEdit={handleModifierEdit}
                      onModifierEditChange={handleModifierEditChange}
                      onToggleModifiers={handleToggleModifiers}
                    />
                  ))}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted text-center py-12">Меню пусто</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

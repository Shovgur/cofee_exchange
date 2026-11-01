'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layers, Loader2, RefreshCw, Search } from 'lucide-react';
import {
  adminGetModifierBeanPrice,
  adminSetModifierBeanPrice,
} from '@/lib/api/loyalty/admin';
import {
  adminListModifiers,
  type AdminModifierRow,
} from '@/lib/api/loyalty/modifiers-admin';
import BeanPriceCell, {
  type BeanPriceEditableRow,
} from '@/components/admin/loyalty/BeanPriceCell';
import { useCountry } from '@/contexts/CountryContext';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

type ModifierRow = AdminModifierRow & BeanPriceEditableRow;

export default function AdminModifierBeanPricesPage() {
  const { country } = useCountry();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ModifierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, show: showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminListModifiers({
        country: country.id,
        query: query.trim() || undefined,
        include_inactive: true,
        limit: 500,
      });
      const rows: ModifierRow[] = await Promise.all(
        page.items.map(async (m) => {
          let beanPrice: number | null = null;
          try {
            const bp = await adminGetModifierBeanPrice(m.id);
            beanPrice = bp.price_beans;
          } catch {
            beanPrice = null;
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
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [country.id, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const patch = (id: string, patch: Partial<ModifierRow>) => {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleEdit = (id: string) => {
    setItems((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, editing: true, editValue: m.beanPrice != null ? String(m.beanPrice) : '' }
          : { ...m, editing: false },
      ),
    );
  };

  const handleSave = async (id: string) => {
    const mod = items.find((m) => m.id === id);
    if (!mod) return;
    const price = parseInt(mod.editValue, 10);
    if (!Number.isFinite(price) || price < 0) return;

    patch(id, { saving: true });
    try {
      const res = await adminSetModifierBeanPrice(id, price);
      patch(id, { beanPrice: res.price_beans, editing: false, saving: false });
      showToast(`${mod.name}: ${res.price_beans} Б`, true);
    } catch (e) {
      patch(id, { saving: false });
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <div className="p-8 max-w-3xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
              <Layers size={22} className="text-orange" />
              Модификаторы · цена в Бинах
            </h1>
            <p className="text-sm text-muted">
              {country.name} · нажмите на цену, чтобы изменить
            </p>
          </div>
          <Button variant="secondary" onClick={load} loading={loading}>
            {!loading && <RefreshCw size={14} />}
            Обновить
          </Button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию…"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-muted" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {items.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3.5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{mod.name}</p>
                  <p className="text-[11px] text-muted">
                    {mod.base_price} {country.currencySymbol ?? '₽'}
                    {!mod.is_active ? ' · неактивен' : ''}
                  </p>
                </div>
                <BeanPriceCell
                  row={mod}
                  onEdit={() => handleEdit(mod.id)}
                  onEditChange={(v) => patch(mod.id, { editValue: v })}
                  onSave={() => void handleSave(mod.id)}
                />
              </div>
            ))}
            {items.length === 0 && !loading && (
              <p className="py-12 text-center text-sm text-muted">Модификаторы не найдены</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  adminGetModifierBeanPrice,
  adminSetModifierBeanPrice,
} from '@/lib/api/loyalty/admin';
import { fetchMenuItem } from '@/lib/api/loyalty/catalog';
import type { ApiMenuModifier } from '@/lib/api/loyalty/types';
import BeanPriceCell, {
  type BeanPriceEditableRow,
} from '@/components/admin/loyalty/BeanPriceCell';

type ModRow = ApiMenuModifier & BeanPriceEditableRow;

export default function DrinkModifierBeanPrices({ menuItemId }: { menuItemId: string }) {
  const [mods, setMods] = useState<ModRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchMenuItem(menuItemId)
      .then(async (detail) => {
        const rows = await Promise.all(
          detail.modifiers.map(async (mod) => {
            let beanPrice: number | null = mod.price_beans;
            try {
              const bp = await adminGetModifierBeanPrice(mod.id);
              beanPrice = bp.price_beans;
            } catch {
              /* use menu default */
            }
            return {
              ...mod,
              beanPrice,
              editing: false,
              editValue: beanPrice != null ? String(beanPrice) : '',
              saving: false,
            };
          }),
        );
        if (!cancelled) setMods(rows);
      })
      .catch(() => {
        if (!cancelled) setMods([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [menuItemId]);

  const patch = (id: string, p: Partial<ModRow>) => {
    setMods((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  };

  const handleEdit = (id: string) => {
    setMods((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, editing: true, editValue: m.beanPrice != null ? String(m.beanPrice) : '' }
          : { ...m, editing: false },
      ),
    );
  };

  const handleSave = async (id: string) => {
    const mod = mods.find((m) => m.id === id);
    if (!mod) return;
    const price = parseInt(mod.editValue, 10);
    if (!Number.isFinite(price) || price < 0) return;
    patch(id, { saving: true });
    try {
      const res = await adminSetModifierBeanPrice(id, price);
      patch(id, { beanPrice: res.price_beans, editing: false, saving: false });
    } catch {
      patch(id, { saving: false });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 size={20} className="animate-spin text-muted" />
      </div>
    );
  }

  if (mods.length === 0) {
    return <p className="text-xs text-muted">У этой позиции нет модификаторов.</p>;
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="text-sm font-medium">Модификаторы · цена в Бинах</p>
      {mods.map((mod) => (
        <div
          key={mod.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-el/60 px-3 py-2"
        >
          <span className="min-w-0 truncate text-sm">{mod.name}</span>
          <BeanPriceCell
            size="sm"
            row={mod}
            onEdit={() => handleEdit(mod.id)}
            onEditChange={(v) => patch(mod.id, { editValue: v })}
            onSave={() => void handleSave(mod.id)}
          />
        </div>
      ))}
    </div>
  );
}

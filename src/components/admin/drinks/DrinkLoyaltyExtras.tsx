'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { adminGetItemBeanPrice, adminSetItemBeanPrice } from '@/lib/api/loyalty/admin';
import { adminListMenuItems, adminPatchMenuItem } from '@/lib/api/loyalty/menu-admin';
import { loyaltyUploadMedia } from '@/lib/api/loyalty/client';
import type { ApiMenuItem } from '@/lib/api/loyalty/types';
import { useCountry } from '@/contexts/CountryContext';
import type { AdminDrinkRead } from '@/lib/api/exchange/admin-drinks';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

function matchMenuItem(drink: AdminDrinkRead, items: ApiMenuItem[]): ApiMenuItem | null {
  const pos = drink.pos_item_id?.trim();
  if (!pos) return null;
  const cap = drink.unitCapacity;
  const byPos = items.filter((i) => i.pos_item_id === pos);
  if (byPos.length === 0) return null;
  if (cap == null) return byPos[0];
  const bySize = byPos.find((i) => {
    const m = i.size_name.match(/[\d.,]+/);
    if (!m) return false;
    const vol = parseFloat(m[0].replace(',', '.'));
    return Number.isFinite(vol) && Math.abs(vol - cap) < 0.021;
  });
  return bySize ?? byPos[0];
}

export default function DrinkLoyaltyExtras({ drink }: { drink: AdminDrinkRead }) {
  const { country } = useCountry();
  const [menuItem, setMenuItem] = useState<ApiMenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beanPrice, setBeanPrice] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await adminListMenuItems({
        country: country.id,
        limit: 500,
        include_inactive: true,
      });
      const found = matchMenuItem(drink, page.items);
      setMenuItem(found);
      if (found) {
        try {
          const bp = await adminGetItemBeanPrice(found.id);
          setBeanPrice(String(bp.price_beans));
        } catch {
          setBeanPrice(found.price_beans != null ? String(found.price_beans) : '');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [country.id, drink]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!menuItem) return;
    setSaving(true);
    setStatus('idle');
    try {
      const updated = await adminPatchMenuItem(menuItem.id, {
        description: menuItem.description ?? undefined,
        image_url: menuItem.image_url ?? undefined,
        calories: menuItem.calories ?? undefined,
        protein: menuItem.protein ?? undefined,
        fat: menuItem.fat ?? undefined,
        carbs: menuItem.carbs ?? undefined,
      });
      const price = parseInt(beanPrice, 10);
      if (price > 0) {
        await adminSetItemBeanPrice(menuItem.id, price);
      }
      setMenuItem(updated);
      setStatus('ok');
    } catch {
      setStatus('err');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  }

  if (!menuItem) {
    return (
      <p className="py-4 text-sm text-muted">
        Позиция в меню лояльности не найдена (нужен совпадающий{' '}
        <code className="text-xs">pos_item_id</code> и объём). Контент и цена в Бинах
        настраиваются в разделе «Контент меню» / «Цены в Бинах».
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Меню приложения: {menuItem.name} · {menuItem.size_name}
      </p>
      <textarea
        value={menuItem.description ?? ''}
        onChange={(e) => setMenuItem({ ...menuItem, description: e.target.value })}
        rows={4}
        placeholder="Описание для приложения"
        className="w-full rounded-xl border border-border bg-surface-el px-3 py-2 text-sm"
      />
      <input
        value={menuItem.image_url ?? ''}
        onChange={(e) => setMenuItem({ ...menuItem, image_url: e.target.value })}
        placeholder="URL фото"
        className="w-full rounded-xl border border-border bg-surface-el px-3 py-2 text-sm"
      />
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
        <Upload size={14} />
        Загрузить фото
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            void loyaltyUploadMedia('drinks', f).then((out) =>
              setMenuItem({ ...menuItem, image_url: out.url }),
            );
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(['calories', 'protein', 'fat', 'carbs'] as const).map((key) => (
          <input
            key={key}
            type="number"
            value={menuItem[key] ?? ''}
            onChange={(e) =>
              setMenuItem({
                ...menuItem,
                [key]: e.target.value ? Number(e.target.value) : null,
              })
            }
            placeholder={key}
            className="rounded-lg border border-border bg-surface-el px-2 py-1.5 text-xs"
          />
        ))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Цена в Бинах</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={beanPrice}
            onChange={(e) => setBeanPrice(e.target.value)}
            className="w-full max-w-[10rem] rounded-xl border border-border bg-surface-el px-3 py-2 text-sm"
          />
          <CoffeeBeanIcon size={16} className="text-orange" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Сохранить контент и Бины
        </Button>
        {status === 'ok' && <span className="text-sm text-success">Сохранено</span>}
        {status === 'err' && <span className="text-sm text-danger">Ошибка</span>}
      </div>
    </div>
  );
}

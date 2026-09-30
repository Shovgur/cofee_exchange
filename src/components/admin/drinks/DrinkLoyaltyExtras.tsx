'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { adminGetItemBeanPrice, adminSetItemBeanPrice } from '@/lib/api/loyalty/admin';
import { adminPatchMenuItem } from '@/lib/api/loyalty/menu-admin';
import { fetchMenu } from '@/lib/api/loyalty/catalog';
import { loyaltyUploadMedia } from '@/lib/api/loyalty/client';
import type { ApiMenuItem } from '@/lib/api/loyalty/types';
import { useCountry } from '@/contexts/CountryContext';
import type { AdminDrinkRead } from '@/lib/api/exchange/admin-drinks';
import { matchLoyaltyMenuItem } from '@/lib/admin/match-loyalty-menu-item';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

export default function DrinkLoyaltyExtras({ drink }: { drink: AdminDrinkRead }) {
  const { country } = useCountry();
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [menuItem, setMenuItem] = useState<ApiMenuItem | null>(null);
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beanPrice, setBeanPrice] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const applyMenuItem = useCallback(async (found: ApiMenuItem | null) => {
    setMenuItem(found);
    if (!found) {
      setBeanPrice('');
      return;
    }
    try {
      const bp = await adminGetItemBeanPrice(found.id);
      setBeanPrice(String(bp.price_beans));
    } catch {
      setBeanPrice(found.price_beans != null ? String(found.price_beans) : '');
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchMenu(country.id);
      setMenuItems(items);
      const found = matchLoyaltyMenuItem(drink, items);
      await applyMenuItem(found);
      setManualId(found?.id ?? '');
    } finally {
      setLoading(false);
    }
  }, [country.id, drink, applyMenuItem]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!manualId) return;
    const picked = menuItems.find((i) => i.id === manualId);
    if (picked) void applyMenuItem(picked);
  }, [manualId, menuItems, applyMenuItem]);

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
      <div className="space-y-3 py-2 text-sm text-muted">
        <p>
          Автоматически не нашли позицию в меню приложения для «{drink.name}»
          {drink.unitCapacity != null ? ` (${drink.unitCapacity} л)` : ''}. Выберите вручную —
          тот же список, что на странице «Цены в Бинах».
        </p>
        {drink.pos_item_id ? (
          <p className="text-xs">
            pos_item_id в движке: <code className="text-foreground">{drink.pos_item_id}</code>
          </p>
        ) : (
          <p className="text-xs text-amber-800">
            У напитка в движке цен не заполнен pos_item_id — связь с меню только по названию и
            объёму или вручную.
          </p>
        )}
        <select
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-el px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">— Выберите позицию меню —</option>
          {menuItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} · {i.size_name} ({i.price_beans ?? '—'} Б)
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted">
          Меню приложения: {menuItem.name} · {menuItem.size_name}
        </p>
        <select
          value={menuItem.id}
          onChange={(e) => setManualId(e.target.value)}
          className="rounded-lg border border-border bg-surface-el px-2 py-1 text-xs"
        >
          {menuItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} · {i.size_name}
            </option>
          ))}
        </select>
      </div>
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

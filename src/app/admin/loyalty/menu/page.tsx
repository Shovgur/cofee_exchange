'use client';

import { useCallback, useEffect, useState } from 'react';
import { GlassWater, Loader2, Save, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { adminListMenuItems, adminPatchMenuItem } from '@/lib/api/loyalty/menu-admin';
import type { ApiMenuItem } from '@/lib/api/loyalty/types';
import { loyaltyUploadMedia } from '@/lib/api/loyalty/client';
import { useCountry } from '@/contexts/CountryContext';

export default function AdminMenuContentPage() {
  const { country } = useCountry();
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiMenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await adminListMenuItems({ country: country.id, limit: 100, include_inactive: true });
      setItems(page.items);
    } finally {
      setLoading(false);
    }
  }, [country.id]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await adminPatchMenuItem(selected.id, {
        description: selected.description ?? undefined,
        image_url: selected.image_url ?? undefined,
        calories: selected.calories ?? undefined,
        protein: selected.protein ?? undefined,
        fat: selected.fat ?? undefined,
        carbs: selected.carbs ?? undefined,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelected(updated);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-8 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <GlassWater className="text-orange" />
          Контент напитков
        </h1>
        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full text-left rounded-xl border border-border bg-surface px-4 py-3 hover:border-orange/40"
            >
              <p className="font-medium text-sm">{item.name} · {item.size_name}</p>
              <p className="text-xs text-muted truncate">{item.description || 'Без описания'}</p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 sticky top-6 h-fit">
          <h2 className="font-semibold">{selected.name}</h2>
          <textarea
            value={selected.description ?? ''}
            onChange={(e) => setSelected({ ...selected, description: e.target.value })}
            rows={4}
            placeholder="Описание"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <input
            value={selected.image_url ?? ''}
            onChange={(e) => setSelected({ ...selected, image_url: e.target.value })}
            placeholder="URL фото"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
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
                  setSelected({ ...selected, image_url: out.url }),
                );
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['calories', 'protein', 'fat', 'carbs'] as const).map((key) => (
              <input
                key={key}
                type="number"
                value={selected[key] ?? ''}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    [key]: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder={key}
                className="rounded-lg border border-border px-2 py-1.5 text-xs"
              />
            ))}
          </div>
          <Button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2">
            <Save size={16} /> Сохранить
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Loader2, ExternalLink, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  adminCreateStore,
  adminListStores,
  type AdminStore,
} from '@/lib/api/loyalty/stores';
import { cn } from '@/lib/utils';

export default function AdminStoresPage() {
  const [items, setItems] = useState<AdminStore[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminListStores({ query, limit: 50, offset: 0 });
      setItems(page.items);
      setTotal(page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    const external_id = `manual-${Date.now()}`;
    setCreating(true);
    try {
      const store = await adminCreateStore({ external_id, name: 'Новая кофейня' });
      window.location.href = `/admin/stores/${store.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать');
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <MapPin size={22} className="text-orange" />
            Кофейни
          </h1>
          <p className="text-sm text-muted">
            Черновики не видны в приложении, пока не включена публикация.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating} className="flex items-center gap-2">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Добавить
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию, адресу, external_id…"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <p className="mb-3 text-xs text-muted">Всего: {total}</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Link
              key={s.id}
              href={`/admin/stores/${s.id}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-orange/40"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{s.name || s.pos_name || s.external_id}</p>
                <p className="text-xs text-muted truncate">{s.address || s.pos_address || '—'}</p>
                <p className="mt-1 text-[10px] text-muted font-mono">{s.external_id}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-medium',
                    s.is_published ? 'bg-success/10 text-success' : 'bg-muted/20 text-muted',
                  )}
                >
                  {s.is_published ? 'В приложении' : 'Черновик'}
                </span>
                {!s.is_active && (
                  <span className="text-danger">Неактивна</span>
                )}
              </div>
              <ExternalLink size={14} className="text-muted" />
            </Link>
          ))}
          {items.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">Кофеен пока нет</p>
          )}
        </div>
      )}
    </div>
  );
}

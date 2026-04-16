'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Plus,
  AlertCircle,
  ChevronRight,
  Lock,
  Unlock,
  Activity,
  ActivityIcon,
} from 'lucide-react';
import { fetchAdminDrinksList, postAdminDrinkToggleActive, type AdminDrinkRead } from '@/lib/api/admin-drinks';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { AdminMobileBackLink } from '@/components/admin/AdminMobileBackLink';

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium', color)}>
      {children}
    </span>
  );
}

/** Для группировки вариантов одного напитка (разный unitCapacity) */
function normalizeDrinkGroupName(name: string): string {
  return name.trim().toLocaleLowerCase('ru');
}

function sortDrinksForAdmin(list: AdminDrinkRead[]): AdminDrinkRead[] {
  return [...list].sort((a, b) => {
    const na = normalizeDrinkGroupName(a.name);
    const nb = normalizeDrinkGroupName(b.name);
    if (na !== nb) return na.localeCompare(nb, 'ru');
    const ca = a.unitCapacity ?? Number.POSITIVE_INFINITY;
    const cb = b.unitCapacity ?? Number.POSITIVE_INFINITY;
    return ca - cb;
  });
}

function volumeLabel(unitCapacity: number | null): string {
  if (unitCapacity != null && !Number.isNaN(unitCapacity)) return `${unitCapacity} л`;
  return 'Без объёма';
}

export default function AdminDrinksListPage() {
  const router = useRouter();
  const [drinks, setDrinks] = useState<AdminDrinkRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDrinks(await fetchAdminDrinksList(500));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { sortedDrinks, multiNameKeys } = useMemo(() => {
    const sorted = sortDrinksForAdmin(drinks);
    const counts = new Map<string, number>();
    for (const d of sorted) {
      const k = normalizeDrinkGroupName(d.name);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const multiNameKeys = new Set<string>();
    counts.forEach((n, k) => { if (n > 1) multiNameKeys.add(k); });
    return { sortedDrinks: sorted, multiNameKeys };
  }, [drinks]);

  async function handleToggle(d: AdminDrinkRead) {
    setTogglingId(d.drink_id);
    try {
      const updated = await postAdminDrinkToggleActive(d.drink_id);
      setDrinks(prev => prev.map(x => x.drink_id === updated.drink_id ? updated : x));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-full pb-12">
      <AdminMobileBackLink />
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-3 pt-3 backdrop-blur-md sm:px-4 lg:px-8 lg:pt-8 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Напитки</h1>
            <p className="text-xs text-muted mt-0.5">
              {loading ? '…' : `${sortedDrinks.length} позиций`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-surface-el text-muted hover:text-white transition-colors disabled:opacity-40"
              title="Обновить"
            >
              <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            </button>
            <Link href="/admin/drinks/new">
              <Button>
                <Plus size={15} />
                Добавить
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-3xl px-3 sm:px-4 lg:px-8">
        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {loading && drinks.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-surface-el/50">
              {['Название', 'Текущая цена', 'База', '% откл.', 'Статус', ''].map((h, i) => (
                <div key={i} className="text-[11px] font-medium text-muted uppercase tracking-wider">{h}</div>
              ))}
            </div>

            {sortedDrinks.length === 0 && !loading && (
              <p className="px-5 py-8 text-sm text-muted text-center">Нет напитков</p>
            )}

            {sortedDrinks.map((d, i) => {
              const prev = i > 0 ? sortedDrinks[i - 1] : null;
              const groupKey = normalizeDrinkGroupName(d.name);
              const isMulti = multiNameKeys.has(groupKey);
              const isNewGroup = !prev || normalizeDrinkGroupName(prev.name) !== groupKey;

              return (
              <Fragment key={d.drink_id}>
                {isMulti && isNewGroup && (
                  <>
                    {i > 0 && <div className="h-px bg-border mx-5" role="presentation" />}
                    <div className="px-5 pt-4 pb-2 text-sm font-semibold text-white tracking-tight">
                      {d.name}
                    </div>
                  </>
                )}
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/drinks/${d.drink_id}`)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/drinks/${d.drink_id}`);
                  }
                }}
                className={cn(
                  'grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-border hover:bg-surface-el/30 transition-colors cursor-pointer text-left',
                  isMulti && isNewGroup && 'pt-1',
                  i === sortedDrinks.length - 1 && 'last:border-b-0',
                )}
              >
                {/* Name / объём */}
                <div className="min-w-0">
                  {isMulti ? (
                    <div
                      className={cn(
                        'font-medium text-sm',
                        !isNewGroup && 'pl-2 sm:pl-3 border-l-2 border-orange/35',
                      )}
                    >
                      {volumeLabel(d.unitCapacity)}
                    </div>
                  ) : (
                    <>
                      <div className="font-medium text-sm truncate">{d.name}</div>
                      {d.unitCapacity != null && (
                        <div className="text-[11px] text-muted mt-0.5">{d.unitCapacity} л</div>
                      )}
                    </>
                  )}
                </div>

                {/* Текущая цена */}
                <div className="hidden sm:block text-sm font-mono">
                  {parseFloat(d.current_price).toFixed(0)} ₽
                </div>

                {/* База */}
                <div className="hidden sm:block text-sm font-mono text-muted">
                  {parseFloat(d.defaultSalePrice).toFixed(0)} ₽
                </div>

                {/* % */}
                <div className={cn(
                  'hidden sm:block text-sm font-mono font-medium',
                  parseFloat(d.current_pct) > 0 ? 'text-success' : parseFloat(d.current_pct) < 0 ? 'text-danger' : 'text-muted',
                )}>
                  {parseFloat(d.current_pct) > 0 ? '+' : ''}{parseFloat(d.current_pct).toFixed(2)}%
                </div>

                {/* Статус */}
                <div className="hidden sm:flex flex-col gap-1">
                  <Badge color={d.is_active ? 'bg-success/15 text-success' : 'bg-surface-el text-muted'}>
                    {d.is_active ? <Activity size={10} /> : <ActivityIcon size={10} />}
                    {d.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                  {d.is_fixed && (
                    <Badge color="bg-orange/15 text-orange">
                      <Lock size={10} />
                      Фикс {d.fixed_pct ? `${d.fixed_pct}%` : ''}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(d)}
                    disabled={togglingId === d.drink_id}
                    title={d.is_active ? 'Выключить из рынка' : 'Включить в рынок'}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      d.is_active
                        ? 'text-success hover:bg-success/10'
                        : 'text-muted hover:bg-surface-el',
                      togglingId === d.drink_id && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {d.is_active ? <Unlock size={14} /> : <Lock size={14} />}
                  </button>
                  <span className="p-1.5 text-muted pointer-events-none" aria-hidden title="Открыть">
                    <ChevronRight size={15} />
                  </span>
                </div>
              </div>
              </Fragment>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

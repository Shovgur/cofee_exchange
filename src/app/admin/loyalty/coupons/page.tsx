'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Ticket,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import {
  adminListCoupons,
  adminCancelCoupon,
  type AdminCouponOut,
} from '@/lib/api/loyalty/admin';
import type { ApiCouponStatus } from '@/lib/api/loyalty/types';
import { cn, formatDateTime, couponStatusLabel, couponStatusColor } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const PAGE_SIZE = 50;

const FILTERS: { id: ApiCouponStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'used', label: 'Завершённые' },
  { id: 'expired', label: 'Просроченные' },
  { id: 'reserved', label: 'В резерве' },
  { id: 'refunded', label: 'Возвращённые' },
  { id: 'needs_review', label: 'На проверке' },
];

function priceLabel(coupon: AdminCouponOut): string {
  if (coupon.purchase_kind === 'manual') return 'Выдан вручную';
  if (coupon.purchase_kind === 'bean') return `${coupon.price_beans ?? 0} Бинов`;
  return `${coupon.price_money ?? '—'} ${coupon.currency}`;
}

/** Для завершённых показываем факт использования, для остальных — срок жизни. */
function timelineLabel(coupon: AdminCouponOut): string {
  if (coupon.used_at) return `Использован: ${formatDateTime(coupon.used_at)}`;
  if (coupon.status === 'expired') return `Истёк: ${formatDateTime(coupon.expires_at)}`;
  return `Действует до: ${formatDateTime(coupon.expires_at)}`;
}

function CouponRow({
  coupon,
  onOpenUser,
  onCancel,
}: {
  coupon: AdminCouponOut;
  onOpenUser: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-b border-border/50 px-5 py-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              № {coupon.number ?? coupon.qr_token}
            </span>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
              couponStatusColor(coupon.status),
            )}>
              {couponStatusLabel(coupon.status)}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenUser}
            className="mt-1 flex items-center gap-1 text-xs text-muted transition-colors hover:text-orange"
          >
            {coupon.user_phone} · код {coupon.user_code}
            <ChevronRight size={12} />
          </button>
        </div>

        {coupon.status === 'active' && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="shrink-0 flex items-center gap-1.5 !px-3 !py-1.5 !text-xs"
          >
            <XCircle size={13} /> Отменить
          </Button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted sm:grid-cols-3">
        <span>Оплата: {priceLabel(coupon)}</span>
        <span>Куплен: {formatDateTime(coupon.created_at)}</span>
        <span>{timelineLabel(coupon)}</span>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<ApiCouponStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [coupons, setCoupons] = useState<AdminCouponOut[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<AdminCouponOut | null>(null);
  const [cancelComment, setCancelComment] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const requestId = useRef(0);

  const load = useCallback(async (status: ApiCouponStatus | 'all', q: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await adminListCoupons({
        status: status === 'all' ? undefined : status,
        search: q.trim() || undefined,
        limit: PAGE_SIZE,
      });
      if (id !== requestId.current) return;
      setCoupons(res.items);
      setTotal(res.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setCoupons([]);
      setTotal(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(filter, search), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [filter, search, load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await adminListCoupons({
        status: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset: coupons.length,
      });
      setCoupons((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await adminCancelCoupon(cancelTarget.id, cancelComment || undefined);
      setCoupons((prev) =>
        prev.map((c) => (c.id === cancelTarget.id ? { ...c, status: 'refunded' as const } : c)),
      );
      setCancelTarget(null);
      setCancelComment('');
      showToast('Купон отменён', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка отмены', false);
    } finally {
      setCancelLoading(false);
    }
  };

  const hasMore = total !== null && coupons.length < total;

  return (
    <div className="p-8 max-w-4xl">
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
          toast.ok ? 'bg-green-500' : 'bg-danger',
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Купоны</h1>
          <p className="text-sm text-muted">Поиск по номеру купона или QR-токену</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
          <Ticket size={16} className="text-orange" />
          <span className="text-sm font-bold tabular-nums">{total === null ? '—' : total}</span>
          <span className="text-xs text-muted">всего</span>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="123456789012 или QR-токен…"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === f.id
                ? 'border-orange bg-orange/10 text-orange'
                : 'border-border text-muted hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && coupons.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-muted" />
        </div>
      )}

      {!loading && coupons.length === 0 && !error && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Ticket size={40} strokeWidth={1.2} />
          <p className="text-sm">Купоны не найдены</p>
        </div>
      )}

      {coupons.length > 0 && (
        <>
          <p className="mb-3 text-xs text-muted">Показано {coupons.length} из {total}</p>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {coupons.map((c) => (
              <CouponRow
                key={c.id}
                coupon={c}
                onOpenUser={() => router.push(`/admin/loyalty/users/${c.user_id}`)}
                onCancel={() => setCancelTarget(c)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Показать ещё'}
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Отменить купон"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Купон № {cancelTarget?.number ?? cancelTarget?.qr_token} будет отменён, Бины или
            деньги вернутся пользователю согласно правилам программы.
          </p>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Причина (необязательно)
            </label>
            <input
              type="text"
              value={cancelComment}
              onChange={(e) => setCancelComment(e.target.value)}
              placeholder="Причина отмены"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setCancelTarget(null)}>
              Закрыть
            </Button>
            <Button variant="danger" fullWidth disabled={cancelLoading} onClick={handleCancel}>
              {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : 'Отменить купон'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

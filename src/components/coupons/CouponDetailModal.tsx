'use client';

import { useCallback, useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DecorativeBarcode from '@/components/ui/DecorativeBarcode';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';
import {
  couponStatusLabel,
  couponStatusColor,
  formatDateTime,
  formatFullDate,
} from '@/lib/utils';
import { fetchCoupon, mapApiCouponToUi } from '@/lib/api/loyalty';
import type { Country, Coupon } from '@/types';
import { Loader2, RefreshCw } from 'lucide-react';

interface CouponDetailModalProps {
  couponId: string | null;
  country: Country;
  onClose: () => void;
}

export default function CouponDetailModal({
  couponId,
  country,
  onClose,
}: CouponDetailModalProps) {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!couponId) return;
    setLoading(true);
    setError(null);
    try {
      const api = await fetchCoupon(couponId);
      setCoupon(mapApiCouponToUi(api, country));
    } catch (e) {
      setCoupon(null);
      setError(e instanceof Error ? e.message : 'Не удалось загрузить купон');
    } finally {
      setLoading(false);
    }
  }, [couponId, country]);

  useEffect(() => {
    if (!couponId) {
      setCoupon(null);
      setError(null);
      return;
    }
    void load();
  }, [couponId, load]);

  const showQr = coupon?.status === 'active' || coupon?.status === 'reserved';

  return (
    <Modal open={!!couponId} onClose={onClose} title="Ваш купон">
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Loader2 size={28} className="animate-spin text-muted" />
          <p className="text-sm text-muted">Загружаем актуальные данные…</p>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-4 py-4">
          <p className="text-sm text-danger text-center">{error}</p>
          <Button fullWidth onClick={() => void load()}>
            Повторить
          </Button>
        </div>
      )}

      {!loading && !error && coupon && (
        <div className="space-y-5 pb-1">
          {coupon.purchaseSummary && (
            <div className="rounded-2xl border border-border bg-surface-el p-4">
              <p className="text-xs font-semibold text-muted mb-2">Состав заказа</p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{coupon.purchaseSummary}</p>
            </div>
          )}

          {showQr ? (
            <>
              <DecorativeBarcode value={coupon.qrData} />
              <p className="text-center text-sm text-muted">
                Покажите штрихкод кассиру для получения напитка
              </p>
            </>
          ) : (
            <p className="text-center text-sm text-muted py-2">
              QR-код недоступен для купонов со статусом «{couponStatusLabel(coupon.status)}»
            </p>
          )}

          <div className="bg-surface-el rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted shrink-0">Куплено</span>
              <span className="text-right">{formatDateTime(coupon.purchasedAt)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted shrink-0">Действует до</span>
              <span className="text-right">{formatFullDate(coupon.expiresAt)}</span>
            </div>
            {coupon.reservedAt && (
              <div className="flex justify-between gap-3">
                <span className="text-muted shrink-0">Зарезервирован</span>
                <span className="text-right">{formatDateTime(coupon.reservedAt)}</span>
              </div>
            )}
            {coupon.usedAt && (
              <div className="flex justify-between gap-3">
                <span className="text-muted shrink-0">Использован</span>
                <span className="text-right">{formatDateTime(coupon.usedAt)}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3">
              <span className="text-muted shrink-0">Статус</span>
              <Badge className={couponStatusColor(coupon.status)}>
                {couponStatusLabel(coupon.status)}
              </Badge>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted shrink-0">Оплата</span>
              <span className="text-right">
                {coupon.paymentMethod === 'beans' ? (
                  <span className="inline-flex items-center gap-1">
                    {coupon.priceBeans ?? '—'} <CoffeeBeanIcon size={12} />
                  </span>
                ) : (
                  `${Math.round(coupon.purchasePrice)} ${coupon.currencySymbol}`
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Купон действителен во всех кофейнях {country.name}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Обновить купон"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-el hover:text-foreground transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

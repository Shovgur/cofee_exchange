'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import AuthGate from '@/components/auth/AuthGate';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { cn, couponStatusLabel, couponStatusColor, formatDateTime, formatFullDate, daysUntil } from '@/lib/utils';
import type { Coupon, CouponStatus } from '@/types';
import { Ticket, Calendar, Clock, Rocket } from 'lucide-react';

const FILTERS: { value: 'all' | CouponStatus; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'used', label: 'Использованные' },
  { value: 'expired', label: 'Просроченные' },
];

function DrinkEmoji({ category }: { category: string }) {
  if (category === 'coffee') return <>☕</>;
  if (category === 'lemonade') return <>🍋</>;
  return <>🍵</>;
}

export default function CouponsPage() {
  const { coupons } = useAuth();
  const { country } = useCountry();
  const [filter, setFilter] = useState<'all' | CouponStatus>('all');
  const [selected, setSelected] = useState<Coupon | null>(null);

  const visible = coupons
    .filter((c) => c.countryId === country.id)
    .filter((c) => filter === 'all' || c.status === filter);

  return (
    <AuthGate fallbackMessage="Ваши купоны доступны только после входа в аккаунт.">
      <div>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl lg:text-3xl font-bold">Купоны</h1>
            <span className="text-xs bg-orange/20 text-orange px-2.5 py-1 rounded-full font-medium">
              {coupons.filter((c) => c.countryId === country.id && c.status === 'active').length} активных
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-select">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filter === value
                    ? 'bg-orange text-white'
                    : 'bg-surface-el text-muted hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-8 pt-2 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.length === 0 && (
            <div className="lg:col-span-2 flex flex-col items-center gap-4 py-16 text-center">
              <Ticket size={40} className="text-muted" />
              <div>
                <p className="font-medium">Нет купонов</p>
                <p className="text-sm text-muted mt-1">
                  {filter === 'all'
                    ? 'Купите напиток в разделе Меню'
                    : 'Нет купонов с таким статусом'}
                </p>
              </div>
            </div>
          )}

          {visible.map((coupon) => (
            <button
              key={coupon.id}
              onClick={() => coupon.status === 'active' && setSelected(coupon)}
              className={cn(
                'w-full text-left bg-surface rounded-2xl p-4 transition-all',
                coupon.status === 'active' && 'active:scale-[0.98]',
                coupon.status !== 'active' && 'opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-el flex items-center justify-center text-2xl flex-shrink-0">
                  {coupon.isPreorder
                    ? <Rocket size={22} className="text-yellow-400" />
                    : <DrinkEmoji category={coupon.category} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{coupon.drinkName}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {coupon.isPreorder && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">Предзаказ</Badge>
                      )}
                      <Badge className={couponStatusColor(coupon.status)}>
                        {couponStatusLabel(coupon.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="font-medium text-white">
                      {Math.round(coupon.purchasePrice)} {coupon.currencySymbol}
                      {coupon.volumeLabel && <span className="text-muted font-normal ml-1">· {coupon.volumeLabel}</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDateTime(coupon.purchasedAt)}
                    </span>
                  </div>
                  {coupon.isPreorder && coupon.saleStartsAt && coupon.status === 'active' && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-yellow-400">
                      <Rocket size={11} />
                      <span>
                        Активируется{' '}
                        <span className="font-medium">
                          {new Date(coupon.saleStartsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        </span>
                      </span>
                    </div>
                  )}
                  {!coupon.isPreorder && coupon.status === 'active' && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted">
                      <Clock size={11} />
                      <span>
                        Действует ещё{' '}
                        <span className="text-orange font-medium">
                          {daysUntil(coupon.expiresAt)} дн.
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Ваш купон"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 bg-surface-el rounded-2xl p-4">
              <span className="text-3xl">
                <DrinkEmoji category={selected.category} />
              </span>
              <div>
                <div className="font-semibold">{selected.drinkName}</div>
                <div className="text-sm text-muted">
                  {Math.round(selected.purchasePrice)} {selected.currencySymbol}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-5 rounded-3xl">
                <QRCodeSVG
                  value={selected.qrData}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0E0E0E"
                  level="M"
                />
              </div>
            </div>

            <p className="text-center text-sm text-muted">
              Покажите QR-код кассиру для получения напитка
            </p>

            <div className="bg-surface-el rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Куплено</span>
                <span>{formatDateTime(selected.purchasedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Действует до</span>
                <span>{formatFullDate(selected.expiresAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Статус</span>
                <Badge className={couponStatusColor(selected.status)}>
                  {couponStatusLabel(selected.status)}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted text-center">
              Купон действителен во всех кофейнях {country.name}
            </p>
          </div>
        )}
      </Modal>
    </AuthGate>
  );
}

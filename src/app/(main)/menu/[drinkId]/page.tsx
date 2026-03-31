'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  ShoppingCart,
  AlertCircle,
  Check,
  Timer,
} from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDrinkById } from '@/lib/mock-data';
import {
  formatPrice,
  formatPriceChange,
  trendColor,
  trendBg,
  cn,
  getNextPriceUpdateAt,
  formatCountdown,
} from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthGate from '@/components/auth/AuthGate';
import dynamic from 'next/dynamic';
import type { Coupon, VolumePrice } from '@/types';

const PriceChart = dynamic(() => import('@/components/menu/PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] bg-surface-el animate-pulse rounded-2xl" />
  ),
});

interface PageProps {
  params: { drinkId: string };
}

function usePriceCountdown(intervalMinutes = 5) {
  const [nextAt, setNextAt] = useState<number>(() => getNextPriceUpdateAt(intervalMinutes));
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = nextAt - now;
      if (diff <= 0) {
        const next = getNextPriceUpdateAt(intervalMinutes);
        setNextAt(next);
        setRemaining(next - Date.now());
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextAt, intervalMinutes]);

  return remaining;
}

export default function DrinkPage({ params }: PageProps) {
  const router = useRouter();
  const { country } = useCountry();
  const { user, addCoupon } = useAuth();
  const drink = getDrinkById(params.drinkId, country.id);

  const [selectedVolume, setSelectedVolume] = useState<VolumePrice | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const remaining = usePriceCountdown(5);

  useEffect(() => {
    if (drink) setSelectedVolume(drink.volumes[1]); // default: 0.4 л
  }, [drink]);

  if (!drink) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 px-8 text-center">
        <AlertCircle size={40} className="text-muted" />
        <p className="text-muted">Напиток не найден</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    );
  }

  const vol = selectedVolume ?? drink.volumes[1];

  const TrendIcon =
    vol.trend === 'up'
      ? TrendingUp
      : vol.trend === 'down'
      ? TrendingDown
      : Minus;

  function handlePurchase() {
    if (!user || !drink) return;
    setBuying(true);
    setTimeout(() => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const couponData: Omit<Coupon, 'id'> = {
        drinkId: drink.id,
        drinkName: drink.name,
        category: drink.category,
        purchasePrice: vol.price,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: new Date().toISOString(),
        expiresAt,
        status: 'active',
        qrData: `CE:${drink.id}:${vol.price}:${vol.value}:${country.id}:${Date.now()}`,
        countryId: country.id,
        volumeLabel: vol.label,
      };
      addCoupon(couponData);
      setBuying(false);
      setBought(true);
      setTimeout(() => {
        setShowBuy(false);
        setBought(false);
        router.push('/coupons');
      }, 1500);
    }, 1200);
  }

  return (
    <AuthGate fallbackMessage="Карточка напитка и возможность покупки доступны только авторизованным пользователям.">
      <div className="pb-6">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => setNotifEnabled((v) => !v)}
            className={cn(
              'p-2 rounded-xl transition-colors',
              notifEnabled ? 'bg-orange/20 text-orange' : 'hover:bg-surface-el text-muted',
            )}
            title={notifEnabled ? 'Уведомление активно' : 'Получать уведомление'}
          >
            <Bell size={18} fill={notifEnabled ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="px-4 space-y-4">
          {/* Hero card */}
          <div className="bg-surface rounded-3xl overflow-hidden">
            {drink.photoUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={drink.photoUrl}
                  alt={drink.name}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="512px"
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold leading-tight">{drink.name}</h1>
                  <p className="text-sm text-muted mt-0.5">{drink.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-2xl font-bold">
                    {formatPrice(vol.price, country.currencySymbol)}
                  </div>
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium mt-1',
                      trendBg(vol.trend),
                    )}
                  >
                    <TrendIcon size={12} />
                    {formatPriceChange(vol.change)}
                  </div>
                </div>
              </div>

              {/* Volume selector */}
              <div className="mb-4">
                <p className="text-xs text-muted mb-2">Объём</p>
                <div className="flex gap-2">
                  {drink.volumes.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setSelectedVolume(v)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border',
                        selectedVolume?.value === v.value
                          ? 'bg-orange text-white border-orange'
                          : 'bg-surface-el text-muted border-transparent hover:border-border',
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Базовая', value: `${Math.round(drink.basePrice * (vol.value === '0.2' ? 0.75 : vol.value === '0.6' ? 1.27 : 1))} ${country.currencySymbol}` },
                  { label: 'Мин. за 48ч', value: formatPrice(Math.min(...vol.priceHistory.map(p => p.price)), country.currencySymbol) },
                  { label: 'Макс. за 48ч', value: formatPrice(Math.max(...vol.priceHistory.map(p => p.price)), country.currencySymbol) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-el rounded-2xl p-3 text-center">
                    <div className="text-xs text-muted mb-1">{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">График цены · {vol.label}</h2>
              <div className="flex items-center gap-1.5 text-xs text-orange bg-orange/10 px-2.5 py-1 rounded-lg">
                <Timer size={12} />
                <span className="tabular-nums font-medium">{formatCountdown(remaining)}</span>
              </div>
            </div>
            <PriceChart
              data={vol.priceHistory}
              currencySymbol={country.currencySymbol}
              basePrice={drink.basePrice}
            />
            <p className="text-xs text-muted mt-2 text-center">
              Перетащи нижний слайдер для зума
            </p>
          </div>

          {/* Description & КБЖУ */}
          <div className="bg-surface rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold mb-2">Описание</h2>
              <p className="text-sm text-muted leading-relaxed">{drink.description}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-3">КБЖУ на порцию</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Кал.',  value: `${drink.calories}` },
                  { label: 'Белки', value: `${drink.proteins}г` },
                  { label: 'Жиры',  value: `${drink.fats}г` },
                  { label: 'Углев.', value: `${drink.carbs}г` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-el rounded-2xl p-2.5 text-center">
                    <div className="text-xs text-muted">{label}</div>
                    <div className="text-sm font-semibold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buy button */}
          <Button fullWidth size="lg" onClick={() => setShowBuy(true)}>
            <ShoppingCart size={18} />
            Купить {vol.label} за {formatPrice(vol.price, country.currencySymbol)}
          </Button>
        </div>
      </div>

      {/* Purchase modal */}
      <Modal
        open={showBuy}
        onClose={() => !buying && setShowBuy(false)}
        title="Подтверждение покупки"
      >
        {bought ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <Check size={32} className="text-success" />
            </div>
            <p className="font-semibold text-lg">Куплено!</p>
            <p className="text-muted text-sm text-center">Купон добавлен в раздел Купоны</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-surface-el rounded-2xl p-4 flex items-center gap-4">
              {drink.photoUrl ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <Image src={drink.photoUrl} alt={drink.name} fill className="object-cover" unoptimized sizes="48px" />
                </div>
              ) : (
                <span className="text-3xl shrink-0">
                  {drink.category === 'coffee' ? '☕' : drink.category === 'lemonade' ? '🍋' : '🍵'}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{drink.name}</div>
                <div className="text-sm text-muted">{vol.label}</div>
              </div>
              <div className="text-xl font-bold shrink-0">
                {formatPrice(vol.price, country.currencySymbol)}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted mb-3">Способ оплаты</p>
              <div className="grid grid-cols-2 gap-2">
                {['Карта', 'Apple Pay', 'Google Pay', 'СБП'].map((method) => (
                  <div
                    key={method}
                    className="bg-surface-el rounded-xl px-4 py-3 text-sm text-muted text-center border border-border relative overflow-hidden"
                  >
                    {method}
                    <span className="absolute top-1 right-1 text-[9px] bg-surface-ov px-1.5 py-0.5 rounded-full text-muted">
                      Скоро
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-2 text-center">Оплата через приложение в разработке</p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">Напиток</span>
                <span>{formatPrice(vol.price, country.currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Итого</span>
                <span className="text-orange">{formatPrice(vol.price, country.currencySymbol)}</span>
              </div>
            </div>

            <Button fullWidth size="lg" onClick={handlePurchase} loading={buying}>
              {buying ? 'Оформляем…' : 'Подтвердить (демо)'}
            </Button>
            <p className="text-xs text-muted text-center -mt-2">
              Это демо — купон будет создан без реальной оплаты
            </p>
          </div>
        )}
      </Modal>
    </AuthGate>
  );
}

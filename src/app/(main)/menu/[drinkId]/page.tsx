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
  trendBg,
  cn,
  getNextPriceUpdateAt,
  formatCountdown,
} from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthGate from '@/components/auth/AuthGate';
import dynamic from 'next/dynamic';
import type { Coupon, PriceTrend, VolumePrice } from '@/types';

const PriceChart = dynamic(() => import('@/components/menu/PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] bg-surface-el animate-pulse rounded-2xl" />
  ),
});

interface PageProps {
  params: { drinkId: string };
}

function applyVolumePriceUpdate(vol: VolumePrice, basePrice: number): VolumePrice {
  const delta = (Math.random() - 0.47) * 0.05;
  const min = Math.round(basePrice * 0.65);
  const max = Math.round(basePrice * 1.45);
  const newPrice = Math.max(min, Math.min(max, Math.round(vol.price * (1 + delta))));
  const newChange = Math.round(((newPrice / basePrice) - 1) * 1000) / 10;
  const newTrend: PriceTrend =
    newChange > 0.5 ? 'up' : newChange < -0.5 ? 'down' : 'neutral';
  return { ...vol, price: newPrice, change: newChange, trend: newTrend };
}

function useLiveVolume(basePrice: number, initial: VolumePrice | null, intervalMinutes = 5) {
  const [nextAt, setNextAt] = useState<number>(() => getNextPriceUpdateAt(intervalMinutes));
  const [remaining, setRemaining] = useState(0);
  const [vol, setVol] = useState<VolumePrice | null>(initial);
  const [flashTrend, setFlashTrend] = useState<PriceTrend | null>(null);
  const [flashGen, setFlashGen] = useState(0);

  // Sync when external selection changes
  useEffect(() => { setVol(initial); }, [initial]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = nextAt - now;
      if (diff <= 0) {
        const next = getNextPriceUpdateAt(intervalMinutes);
        setNextAt(next);
        setRemaining(next - Date.now());
        setVol((prev) => {
          if (!prev) return prev;
          const updated = applyVolumePriceUpdate(prev, basePrice);
          setFlashTrend(updated.trend);
          setFlashGen((g) => g + 1);
          setTimeout(() => setFlashTrend(null), 700);
          return updated;
        });
      } else {
        setRemaining(diff);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextAt, intervalMinutes, basePrice]);

  return { vol, remaining, flashTrend, flashGen };
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

  useEffect(() => {
    if (drink) setSelectedVolume(drink.volumes[1]); // default: 0.4 л
  }, [drink]);

  const basePrice = drink?.basePrice ?? 0;
  const { vol, remaining, flashTrend, flashGen } = useLiveVolume(basePrice, selectedVolume);

  function flashClass(t: PriceTrend | null) {
    if (t === 'up')   return 'price-flash-up';
    if (t === 'down') return 'price-flash-down';
    if (t)            return 'price-flash-neutral';
    return '';
  }

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

  const activeVol = vol ?? drink.volumes[1];

  const TrendIcon =
    activeVol.trend === 'up'
      ? TrendingUp
      : activeVol.trend === 'down'
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
        purchasePrice: activeVol.price,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: new Date().toISOString(),
        expiresAt,
        status: 'active',
        qrData: `CE:${drink.id}:${activeVol.price}:${activeVol.value}:${country.id}:${Date.now()}`,
        countryId: country.id,
        volumeLabel: activeVol.label,
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
                  <div
                    key={flashTrend ? `price-${flashGen}` : 'price'}
                    className={cn(
                      'text-2xl font-bold rounded-lg px-1',
                      flashClass(flashTrend),
                    )}
                  >
                    {formatPrice(activeVol.price, country.currencySymbol)}
                  </div>
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium mt-1',
                      trendBg(activeVol.trend),
                    )}
                  >
                    <TrendIcon size={12} />
                    {formatPriceChange(activeVol.change)}
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
                        activeVol.value === v.value
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
                  { label: 'Базовая', value: `${Math.round(drink.basePrice * (activeVol.value === '0.2' ? 0.75 : activeVol.value === '0.6' ? 1.27 : 1))} ${country.currencySymbol}` },
                  { label: 'Мин. за 48ч', value: formatPrice(Math.min(...activeVol.priceHistory.map(p => p.price)), country.currencySymbol) },
                  { label: 'Макс. за 48ч', value: formatPrice(Math.max(...activeVol.priceHistory.map(p => p.price)), country.currencySymbol) },
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
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-sm font-semibold">График цены · {activeVol.label}</h2>
              <div className="flex w-full shrink-0 items-center justify-between gap-3 rounded-2xl border border-orange/25 bg-gradient-to-r from-orange/[0.12] to-transparent px-4 py-3 sm:w-auto sm:min-w-[11rem]">
                <div className="flex items-center gap-2 text-xs font-medium text-muted">
                  <Timer className="h-5 w-5 shrink-0 text-orange" />
                  <span className="leading-tight">До обновления цены</span>
                </div>
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-orange sm:text-4xl">
                  {formatCountdown(remaining)}
                </span>
              </div>
            </div>
            <PriceChart
              data={activeVol.priceHistory}
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
            Купить {activeVol.label} за {formatPrice(activeVol.price, country.currencySymbol)}
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
                <div className="text-sm text-muted">{activeVol.label}</div>
              </div>
              <div className="text-xl font-bold shrink-0">
                {formatPrice(activeVol.price, country.currencySymbol)}
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
                <span>{formatPrice(activeVol.price, country.currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Итого</span>
                <span className="text-orange">{formatPrice(activeVol.price, country.currencySymbol)}</span>
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

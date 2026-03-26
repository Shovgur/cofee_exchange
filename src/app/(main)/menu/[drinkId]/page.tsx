'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Bell, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDrinkById } from '@/lib/mock-data';
import {
  formatPrice,
  formatPriceChange,
  trendColor,
  trendBg,
  cn,
} from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AuthGate from '@/components/auth/AuthGate';
import dynamic from 'next/dynamic';
import type { Coupon } from '@/types';

const PriceChart = dynamic(() => import('@/components/menu/PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] bg-surface-el animate-pulse rounded-2xl" />
  ),
});

interface PageProps {
  params: { drinkId: string };
}

export default function DrinkPage({ params }: PageProps) {
  const router = useRouter();
  const { country } = useCountry();
  const { user, addCoupon } = useAuth();
  const drink = getDrinkById(params.drinkId, country.id);

  const [showBuy, setShowBuy] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

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

  function handlePurchase() {
    if (!user || !drink) return;
    setBuying(true);

    setTimeout(() => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const couponData: Omit<Coupon, 'id'> = {
        drinkId: drink.id,
        drinkName: drink.name,
        category: drink.category,
        purchasePrice: drink.currentPrice,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: new Date().toISOString(),
        expiresAt,
        status: 'active',
        qrData: `CE:${drink.id}:${drink.currentPrice}:${country.id}:${Date.now()}`,
        countryId: country.id,
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

  const TrendIcon =
    drink.trend === 'up'
      ? TrendingUp
      : drink.trend === 'down'
      ? TrendingDown
      : Minus;

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

        <div className="px-4 space-y-5">
          {/* Hero card */}
          <div className="bg-surface rounded-3xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-3xl mb-2">
                  {drink.category === 'coffee' ? '☕' : drink.category === 'lemonade' ? '🍋' : '🍵'}
                </div>
                <h1 className="text-xl font-bold leading-tight">{drink.name}</h1>
                <p className="text-sm text-muted mt-0.5">{drink.volume}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatPrice(drink.currentPrice, country.currencySymbol)}
                </div>
                <div
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium mt-1',
                    trendBg(drink.trend),
                  )}
                >
                  <TrendIcon size={12} />
                  {formatPriceChange(drink.priceChange)}
                </div>
              </div>
            </div>

            {/* Price stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Базовая', value: formatPrice(drink.basePrice, country.currencySymbol) },
                { label: 'Мин. за 48ч', value: formatPrice(drink.minPrice, country.currencySymbol) },
                { label: 'Макс. за 48ч', value: formatPrice(drink.maxPrice, country.currencySymbol) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-el rounded-2xl p-3 text-center">
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">График цены</h2>
              <span className="text-xs text-muted bg-surface-el px-2 py-1 rounded-lg">48 часов</span>
            </div>
            <PriceChart
              data={drink.priceHistory}
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
                  { label: 'Кал.', value: `${drink.calories}` },
                  { label: 'Белки', value: `${drink.proteins}г` },
                  { label: 'Жиры', value: `${drink.fats}г` },
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
          <Button
            fullWidth
            size="lg"
            onClick={() => setShowBuy(true)}
          >
            <ShoppingCart size={18} />
            Купить за {formatPrice(drink.currentPrice, country.currencySymbol)}
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
            <p className="text-muted text-sm text-center">
              Купон добавлен в раздел Купоны
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-surface-el rounded-2xl p-4 flex items-center gap-4">
              <span className="text-3xl">
                {drink.category === 'coffee' ? '☕' : drink.category === 'lemonade' ? '🍋' : '🍵'}
              </span>
              <div className="flex-1">
                <div className="font-semibold">{drink.name}</div>
                <div className="text-sm text-muted">{drink.volume}</div>
              </div>
              <div className="text-xl font-bold">
                {formatPrice(drink.currentPrice, country.currencySymbol)}
              </div>
            </div>

            {/* Payment methods - disabled (backend required) */}
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
              <p className="text-xs text-muted mt-2 text-center">
                Оплата через приложение в разработке
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">Напиток</span>
                <span>{formatPrice(drink.currentPrice, country.currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Итого</span>
                <span className="text-orange">
                  {formatPrice(drink.currentPrice, country.currencySymbol)}
                </span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handlePurchase}
              loading={buying}
            >
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Rocket,
  Clock,
  ShoppingBag,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getIpoDrinkById } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import DrinkAddonsSheet from '@/components/menu/DrinkAddonsSheet';
import { mockBeansForDrinkPrice } from '@/lib/mock-data/drink-addons';
import type { Coupon } from '@/types';

interface PageProps {
  params: { drinkId: string };
}

function IpoCountdownBlock({ saleStartsAt }: { saleStartsAt: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [saleStartsAt]);

  const diff = Math.max(0, new Date(saleStartsAt).getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const parts =
    days > 0
      ? [
          { value: days, label: 'Дней' },
          { value: hours, label: 'Часов' },
          { value: mins, label: 'Минут' },
        ]
      : [
          { value: hours, label: 'Часов' },
          { value: mins, label: 'Минут' },
          { value: secs, label: 'Секунд' },
        ];

  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-orange" />
        <span className="text-sm font-semibold">До старта продаж</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {parts.map(({ value, label }) => (
          <div key={label} className="bg-surface-el rounded-xl py-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-orange">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IpoDrinkPage({ params }: PageProps) {
  const router = useRouter();
  const { country } = useCountry();
  const { user, addCoupon } = useAuth();
  const ipo = getIpoDrinkById(params.drinkId);

  const [selectedVolume, setSelectedVolume] = useState(0);
  const [showAddons, setShowAddons] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);

  if (!ipo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-8 text-center">
        <AlertCircle size={40} className="text-muted" />
        <p className="text-muted">Напиток не найден</p>
        <Button variant="secondary" onClick={() => router.back()}>Назад</Button>
      </div>
    );
  }

  const vol = ipo.volumes[selectedVolume];
  const baseBeans = mockBeansForDrinkPrice(vol.preorderPrice);

  function confirmPreorder(payload: {
    totalRub: number;
    totalBeans: number;
    labels: string[];
    paymentMethod: 'card' | 'beans';
  }) {
    if (!user || !ipo) return;
    setBuying(true);
    setTimeout(() => {
      const expiresAt = new Date(new Date(ipo.saleStartsAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const extras = payload.labels.length ? payload.labels.join(', ') : '';
      const payLabel =
        payload.paymentMethod === 'card' ? 'Оплата картой' : 'Оплата Бинами';
      const purchaseSummary = [
        `${ipo.name} (IPO, предзаказ)`,
        `Объём: ${vol.label} мл`,
        extras ? `Добавки: ${extras}` : 'Добавки: без добавок',
        `Итого: ${Math.round(payload.totalRub)} ${country.currencySymbol} · ${payload.totalBeans} бинов`,
        payLabel,
      ].join('\n');

      const couponData: Omit<Coupon, 'id'> = {
        drinkId: ipo.id,
        drinkName: ipo.name,
        category: ipo.category,
        purchasePrice: payload.totalRub,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: new Date().toISOString(),
        expiresAt,
        status: 'active',
        qrData: `CE:IPO:${ipo.id}:${payload.totalRub}:${vol.value}:${country.id}:${Date.now()}:${extras}`,
        countryId: country.id,
        isPreorder: true,
        saleStartsAt: ipo.saleStartsAt,
        volumeLabel: extras ? `${vol.label} мл (${extras})` : `${vol.label} мл`,
        purchaseSummary,
        paymentMethod: payload.paymentMethod,
      };
      addCoupon(couponData);
      setBuying(false);
      setBought(true);
      setTimeout(() => {
        setShowAddons(false);
        setBought(false);
        router.push('/coupons');
      }, 1500);
    }, 1200);
  }

  const categoryEmoji =
    ipo.category === 'coffee' ? '☕' : ipo.category === 'lemonade' ? '🍋' : '🍵';

  return (
    <div className="lg:pb-8">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="ml-2 text-sm font-semibold">IPO напитка</span>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-surface rounded-3xl overflow-hidden">
          {ipo.photoUrl ? (
            <div className="relative h-56 w-full">
              <Image
                src={ipo.photoUrl}
                alt={ipo.name}
                fill
                className="object-cover"
                unoptimized
                sizes="512px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="inline-flex items-center gap-1.5 bg-orange text-white text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                  <Rocket size={11} />
                  IPO напитков
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight">{ipo.name}</h1>
                <p className="text-sm text-white/70 mt-0.5">{ipo.description}</p>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="text-4xl mb-3">{categoryEmoji}</div>
              <div className="inline-flex items-center gap-1.5 bg-orange/15 text-orange text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                <Rocket size={11} />
                IPO напитков
              </div>
              <h1 className="text-2xl font-bold leading-tight">{ipo.name}</h1>
              <p className="text-sm text-muted mt-0.5">{ipo.description}</p>
            </div>
          )}
        </div>

        <IpoCountdownBlock saleStartsAt={ipo.saleStartsAt} />

        <div className="bg-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-2">О напитке</h2>
          <p className="text-sm text-muted leading-relaxed">{ipo.fullDescription}</p>
        </div>

        <div className="bg-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-3">Объём и цена предзаказа</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {ipo.volumes.map((v, idx) => (
              <button
                key={v.value}
                onClick={() => setSelectedVolume(idx)}
                className={cn(
                  'rounded-xl p-3 text-center border transition-all',
                  selectedVolume === idx
                    ? 'bg-orange/10 border-orange text-foreground'
                    : 'bg-surface-el border-transparent hover:border-border text-muted',
                )}
              >
                <div className="text-sm font-semibold tabular-nums">{v.label}</div>
                <div className="text-[10px] text-muted mt-0.5">мл</div>
                <div className="text-base font-bold mt-0.5 tabular-nums text-foreground">
                  {v.preorderPrice} ₽
                </div>
                <div className="text-[10px] text-muted mt-0.5">фикс. цена</div>
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3 bg-orange/10 rounded-xl p-3 border border-orange/20">
            <Rocket size={16} className="text-orange mt-0.5 shrink-0" />
            <div className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-orange">Фиксированная цена</span> — ты платишь сейчас
              и получаешь купон по этой цене, даже если рыночная цена после старта продаж будет выше.
              После релиза напиток появится в меню по рыночной цене.
            </div>
          </div>
        </div>

        {user ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setBought(false);
              setShowAddons(true);
            }}
            className="font-bold"
          >
            <ShoppingBag size={18} />
            Предзаказать {vol.label} мл за {vol.preorderPrice} ₽
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="w-full flex items-center justify-center gap-2 bg-surface-el border border-border text-muted py-4 rounded-2xl text-sm"
          >
            <Lock size={16} />
            Войдите, чтобы предзаказать
          </button>
        )}
      </div>

      <DrinkAddonsSheet
        open={showAddons}
        onClose={() => !buying && !bought && setShowAddons(false)}
        drinkName={ipo.name}
        volumeLabel={vol.label}
        basePriceRub={vol.preorderPrice}
        baseBeans={baseBeans}
        currencySymbol={country.currencySymbol}
        drinkNutrition={{ calories: 0, proteins: 0, fats: 0, carbs: 0 }}
        onConfirm={confirmPreorder}
        confirming={buying}
        bought={bought}
      />
    </div>
  );
}

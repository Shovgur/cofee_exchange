'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Rocket,
  Clock,
  Check,
  ShoppingBag,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { getIpoDrinkById } from '@/lib/mock-data';
import { cn, formatIpoCountdown } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { Coupon } from '@/types';

interface PageProps {
  params: { drinkId: string };
}

function IpoCountdownBlock({ saleStartsAt }: { saleStartsAt: string }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const tick = () => setLabel(formatIpoCountdown(saleStartsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [saleStartsAt]);

  // Parse parts
  const diff = Math.max(0, new Date(saleStartsAt).getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;

  const parts =
    days > 0
      ? [
          { value: days,  label: 'Дней' },
          { value: hours, label: 'Часов' },
          { value: mins,  label: 'Минут' },
        ]
      : [
          { value: hours, label: 'Часов' },
          { value: mins,  label: 'Минут' },
          { value: secs,  label: 'Секунд' },
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
  const [showBuy, setShowBuy] = useState(false);
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

  function handlePreorder() {
    if (!user || !ipo) return;
    setBuying(true);
    setTimeout(() => {
      const expiresAt = new Date(new Date(ipo.saleStartsAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const couponData: Omit<Coupon, 'id'> = {
        drinkId: ipo.id,
        drinkName: ipo.name,
        category: ipo.category,
        purchasePrice: vol.preorderPrice,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: new Date().toISOString(),
        expiresAt,
        status: 'active',
        qrData: `CE:IPO:${ipo.id}:${vol.preorderPrice}:${vol.value}:${country.id}:${Date.now()}`,
        countryId: country.id,
        isPreorder: true,
        saleStartsAt: ipo.saleStartsAt,
        volumeLabel: vol.label,
      };
      addCoupon(couponData);
      setBuying(false);
      setBought(true);
      setTimeout(() => {
        setShowBuy(false);
        setBought(false);
        router.push('/coupons');
      }, 1800);
    }, 1200);
  }

  const categoryEmoji =
    ipo.category === 'coffee' ? '☕' : ipo.category === 'lemonade' ? '🍋' : '🍵';

  return (
    <div className="pb-8">
      {/* Top bar */}
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
        {/* Hero */}
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
                <div className="inline-flex items-center gap-1.5 bg-yellow-500/90 text-black text-xs font-bold px-2.5 py-1 rounded-full mb-2">
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
              <div className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                <Rocket size={11} />
                IPO напитков
              </div>
              <h1 className="text-2xl font-bold leading-tight">{ipo.name}</h1>
              <p className="text-sm text-muted mt-0.5">{ipo.description}</p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <IpoCountdownBlock saleStartsAt={ipo.saleStartsAt} />

        {/* Full description */}
        <div className="bg-surface rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-2">О напитке</h2>
          <p className="text-sm text-muted leading-relaxed">{ipo.fullDescription}</p>
        </div>

        {/* Volume selector + preorder price */}
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
                    ? 'bg-orange/10 border-orange text-white'
                    : 'bg-surface-el border-transparent hover:border-border text-muted',
                )}
              >
                <div className="text-sm font-semibold">{v.label}</div>
                <div className={cn('text-base font-bold mt-0.5', selectedVolume === idx ? 'text-orange' : 'text-white')}>
                  {v.preorderPrice} ₽
                </div>
                <div className="text-[10px] text-muted mt-0.5">фикс. цена</div>
              </button>
            ))}
          </div>

          {/* Info block */}
          <div className="flex items-start gap-3 bg-yellow-500/10 rounded-xl p-3">
            <Rocket size={16} className="text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-200/80 leading-relaxed">
              <span className="font-semibold text-yellow-400">Фиксированная цена</span> — ты платишь сейчас
              и получаешь купон по этой цене, даже если рыночная цена после старта продаж будет выше.
              После релиза напиток появится в меню по рыночной цене.
            </div>
          </div>
        </div>

        {/* CTA */}
        {user ? (
          <Button
            fullWidth
            size="lg"
            onClick={() => setShowBuy(true)}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
          >
            <ShoppingBag size={18} />
            Предзаказать {vol.label} за {vol.preorderPrice} ₽
          </Button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full flex items-center justify-center gap-2 bg-surface-el border border-border text-muted py-4 rounded-2xl text-sm"
            >
              <Lock size={16} />
              Войдите, чтобы предзаказать
            </button>
          </div>
        )}
      </div>

      {/* Preorder modal */}
      <Modal
        open={showBuy}
        onClose={() => !buying && setShowBuy(false)}
        title="Подтверждение предзаказа"
      >
        {bought ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Check size={32} className="text-yellow-400" />
            </div>
            <p className="font-semibold text-lg">Предзаказ оформлен!</p>
            <p className="text-muted text-sm text-center">
              Купон добавлен в раздел Купоны. После старта продаж напиток будет доступен в кофейне.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-surface-el rounded-2xl p-4 flex items-center gap-4">
              {ipo.photoUrl ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <Image src={ipo.photoUrl} alt={ipo.name} fill className="object-cover" unoptimized sizes="56px" />
                </div>
              ) : (
                <span className="text-3xl shrink-0">{categoryEmoji}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{ipo.name}</div>
                <div className="text-sm text-muted">{vol.label}</div>
              </div>
              <div className="text-xl font-bold shrink-0 text-orange">
                {vol.preorderPrice} ₽
              </div>
            </div>

            <div className="bg-yellow-500/10 rounded-xl p-3 text-xs text-yellow-200/80">
              <span className="font-semibold text-yellow-400 block mb-1">Предзаказ по фиксированной цене</span>
              Купон активируется после старта продаж. Рыночная цена может быть выше — ты уже зафиксировал свою.
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">Напиток</span>
                <span>{ipo.name} · {vol.label}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Итого</span>
                <span className="text-orange">{vol.preorderPrice} ₽</span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={handlePreorder}
              loading={buying}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
            >
              {buying ? 'Оформляем…' : 'Подтвердить предзаказ (демо)'}
            </Button>
            <p className="text-xs text-muted text-center -mt-2">
              Это демо — купон будет создан без реальной оплаты
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

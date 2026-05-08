"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrices } from "@/contexts/PricesContext";
import { postSale } from "@/lib/api";
import {
  buildDrinkFromGroup,
  getPriceEntriesForDrinkRoute,
} from "@/lib/api/menu";
import { formatPrice, formatPriceChange, trendBg, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import AuthGate from "@/components/auth/AuthGate";
import DrinkAddonsSheet from "@/components/menu/DrinkAddonsSheet";
import CoffeeBeanIcon from "@/components/ui/CoffeeBeanIcon";
import dynamic from "next/dynamic";
import type { Coupon, PriceTrend, VolumePrice } from "@/types";
import { mockBeansForDrinkPrice } from "@/lib/mock-data/drink-addons";

const PriceChart = dynamic(() => import("@/components/menu/PriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] bg-surface-el animate-pulse rounded-2xl" />
  ),
});

const DrinkHero3D = dynamic(() => import("@/components/menu/DrinkHero3D"), {
  ssr: false,
  loading: () => (
    <div className="h-52 min-h-[13rem] w-full animate-pulse bg-surface-el" />
  ),
});

interface PageProps {
  params: { drinkId: string };
}

export default function DrinkPage({ params }: PageProps) {
  const router = useRouter();
  const { country } = useCountry();
  const { user, addCoupon } = useAuth();

  // Берём цены из глобального контекста — тот же источник данных, что и список меню
  const { prices, loading, error, flashMap, flashGen } = usePrices();

  const drink = useMemo(() => {
    if (prices.length === 0) return null;
    const entries = getPriceEntriesForDrinkRoute(params.drinkId, prices);
    if (entries.length === 0) return null;
    return buildDrinkFromGroup(entries, country.id);
  }, [prices, params.drinkId, country.id]);

  const [selectedVolume, setSelectedVolume] = useState<VolumePrice | null>(
    null,
  );
  const [showAddons, setShowAddons] = useState(false);
  const [buying, setBuying] = useState(false);
  const [bought, setBought] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // animKey меняется при каждом реальном изменении цены → React переприсваивает
  // key элементам → CSS-анимация рестартует автоматически
  const [animKey, setAnimKey] = useState(0);
  const [animTrend, setAnimTrend] = useState<PriceTrend | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Пропускаем первый рендер — анимация только на реальных обновлениях
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!drink) return;
    const trend = flashMap.get(drink.id);
    if (trend) {
      setAnimTrend(trend);
      setAnimKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashGen]);

  if (loading) {
    return (
      <div className="pb-6 animate-pulse">
        <div className="flex items-center px-4 pt-4 pb-2">
          <div className="w-8 h-8 rounded-xl bg-surface-el" />
        </div>
        <div className="px-4 space-y-4">
          <div className="bg-surface rounded-3xl overflow-hidden">
            <div className="h-52 min-h-[13rem] bg-surface-el" />
            <div className="p-5 space-y-4">
              <div className="h-5 bg-surface-el rounded w-1/2" />
              <div className="h-4 bg-surface-el rounded w-3/4" />
              <div className="h-10 bg-surface-el rounded-xl" />
            </div>
          </div>
          <div className="bg-surface rounded-3xl h-[280px]" />
        </div>
      </div>
    );
  }

  if (error || !drink) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 px-8 text-center">
        <AlertCircle size={40} className="text-muted" />
        <p className="text-muted">{error ?? "Напиток не найден"}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          Назад
        </Button>
      </div>
    );
  }

  const activeVol =
    selectedVolume &&
    drink.volumes.find((v) => v.value === selectedVolume.value)
      ? selectedVolume
      : (drink.volumes[Math.floor(drink.volumes.length / 2)] ??
        drink.volumes[0]);

  const TrendIcon =
    activeVol.trend === "up"
      ? TrendingUp
      : activeVol.trend === "down"
        ? TrendingDown
        : Minus;

  const drinkBeans = mockBeansForDrinkPrice(activeVol.price);

  async function confirmPurchase(payload: {
    totalRub: number;
    totalBeans: number;
    labels: string[];
  }) {
    if (!user || !drink) return;
    setBuying(true);
    const soldAt = new Date().toISOString();

    if (activeVol.apiDrinkId) {
      postSale({
        pos_item_id: `ce-app-${Date.now()}-${activeVol.apiDrinkId}`,
        size_id: activeVol.value,
        drink_id: activeVol.apiDrinkId,
        quantity: 1,
        sold_at: soldAt,
        source: "app",
      }).catch((err) =>
        console.warn("[sale] ошибка регистрации продажи:", err),
      );
    }

    setTimeout(() => {
      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const extras = payload.labels.length ? payload.labels.join(", ") : "";
      const couponData: Omit<Coupon, "id"> = {
        drinkId: drink.id,
        drinkName: drink.name,
        category: drink.category,
        purchasePrice: payload.totalRub,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        purchasedAt: soldAt,
        expiresAt,
        status: "active",
        qrData: `CE:${drink.id}:${payload.totalRub}:${activeVol.value}:${country.id}:${Date.now()}:${payload.totalBeans}:${extras}`,
        countryId: country.id,
        volumeLabel: extras
          ? `${activeVol.label} (${extras})`
          : activeVol.label,
      };
      addCoupon(couponData);
      setBuying(false);
      setBought(true);
      setTimeout(() => {
        setShowAddons(false);
        setBought(false);
        router.push("/coupons");
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
              "p-2 rounded-xl transition-colors",
              notifEnabled
                ? "bg-orange/20 text-orange"
                : "hover:bg-surface-el text-muted",
            )}
            title={
              notifEnabled ? "Уведомление активно" : "Получать уведомление"
            }
          >
            <Bell size={18} fill={notifEnabled ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="px-4 space-y-4">
          {/* Hero card */}
          <div
            className={cn(
              "bg-surface rounded-3xl overflow-hidden",
              animTrend === "up" && animKey > 0
                ? "dp-hero-up"
                : animTrend === "down" && animKey > 0
                  ? "dp-hero-down"
                  : animTrend === "neutral" && animKey > 0
                    ? "dp-hero-neutral"
                    : "",
            )}
            key={`hero-${animKey}`}
          >
            <DrinkHero3D drink={drink} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0 flex-1 pr-1">
                  <h1 className="text-xl font-bold leading-tight">
                    {drink.name}
                  </h1>
                  <p className="text-sm text-muted mt-0.5">
                    {drink.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <div className="flex flex-nowrap items-baseline justify-end gap-x-4">
                    <span
                      key={`price-rub-${animKey}`}
                      className={cn(
                        "text-2xl font-bold leading-none tracking-tight whitespace-nowrap text-white",
                        animTrend === "up" && animKey > 0
                          ? "dp-price-up"
                          : animTrend === "down" && animKey > 0
                            ? "dp-price-down"
                            : animTrend === "neutral" && animKey > 0
                              ? "dp-price-neutral"
                              : "",
                      )}
                    >
                      {formatPrice(activeVol.price, country.currencySymbol)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 pl-0.5 text-lg font-semibold tabular-nums text-amber-400/95">
                      {drinkBeans}
                      <CoffeeBeanIcon size={17} className="shrink-0 -translate-y-px" />
                    </span>
                  </div>
                  <div
                    key={`pct-${animKey}`}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                      trendBg(activeVol.trend),
                      animKey > 0 ? "dp-pct-in" : "",
                    )}
                  >
                    <TrendIcon size={12} />
                    {formatPriceChange(activeVol.change)}
                  </div>
                </div>
              </div>

              {/* Volume selector */}
              <div className="mb-4 pt-0.5">
                <p className="text-xs text-muted mb-2.5">Объём</p>
                <div className="flex gap-2">
                  {drink.volumes.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setSelectedVolume(v)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                        activeVol.value === v.value
                          ? "bg-orange text-white border-orange"
                          : "bg-surface-el text-muted border-transparent hover:border-border",
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
                  {
                    label: "Базовая",
                    value: formatPrice(
                      activeVol.basePrice ?? drink.basePrice,
                      country.currencySymbol,
                    ),
                  },
                  {
                    label: "Мин.",
                    value: formatPrice(
                      Math.min(...activeVol.priceHistory.map((p) => p.price)),
                      country.currencySymbol,
                    ),
                  },
                  {
                    label: "Макс.",
                    value: formatPrice(
                      Math.max(...activeVol.priceHistory.map((p) => p.price)),
                      country.currencySymbol,
                    ),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-surface-el rounded-2xl p-3 text-center"
                  >
                    <div className="text-xs text-muted mb-1">{label}</div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold mb-3">
              График цены · {activeVol.label}
            </h2>
            <PriceChart
              data={activeVol.priceHistory}
              currencySymbol={country.currencySymbol}
              basePrice={activeVol.basePrice ?? drink.basePrice}
            />
            <p className="text-xs text-muted mt-2 text-center">
              Перетащи нижний слайдер для зума
            </p>
          </div>

          {/* Description & КБЖУ */}
          <div className="bg-surface rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold mb-2">Описание</h2>
              <p className="text-sm text-muted leading-relaxed">
                {drink.description}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-3">КБЖУ на порцию</h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Кал.", value: `${drink.calories}` },
                  { label: "Белки", value: `${drink.proteins}г` },
                  { label: "Жиры", value: `${drink.fats}г` },
                  { label: "Углев.", value: `${drink.carbs}г` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-surface-el rounded-2xl p-2.5 text-center"
                  >
                    <div className="text-xs text-muted">{label}</div>
                    <div className="text-sm font-semibold mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buy */}
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setBought(false);
              setShowAddons(true);
            }}
          >
            <ShoppingCart size={18} />
            <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>
                Купить {activeVol.label} за{" "}
                {formatPrice(activeVol.price, country.currencySymbol)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold tabular-nums opacity-95">
                {drinkBeans}
                <CoffeeBeanIcon size={16} className="shrink-0" />
              </span>
            </span>
          </Button>
        </div>
      </div>

      <DrinkAddonsSheet
        open={showAddons}
        onClose={() => !buying && !bought && setShowAddons(false)}
        drinkName={drink.name}
        volumeLabel={activeVol.label}
        basePriceRub={activeVol.price}
        baseBeans={drinkBeans}
        currencySymbol={country.currencySymbol}
        onConfirm={confirmPurchase}
        confirming={buying}
        bought={bought}
      />
    </AuthGate>
  );
}

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
    paymentMethod: "card" | "beans";
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
      const payLabel =
        payload.paymentMethod === "card" ? "Оплата картой" : "Оплата Бинами";
      const purchaseSummary = [
        drink.name,
        `Объём: ${activeVol.label} мл`,
        extras ? `Добавки: ${extras}` : "Добавки: без добавок",
        `Итого: ${Math.round(payload.totalRub)} ${country.currencySymbol} · ${payload.totalBeans} бинов`,
        payLabel,
      ].join("\n");
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
          ? `${activeVol.label} мл (${extras})`
          : `${activeVol.label} мл`,
        purchaseSummary,
        paymentMethod: payload.paymentMethod,
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
      <div className="pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
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
                  <h1 className="text-xl font-bold leading-tight">{drink.name}</h1>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex flex-col items-end gap-1">
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
                    <span className="inline-flex items-center gap-1 text-lg font-semibold tabular-nums text-amber-400/95">
                      {drinkBeans}
                      <CoffeeBeanIcon size={17} className="shrink-0" />
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
              <div className="mb-0 pt-0.5">
                <p className="text-xs text-muted mb-2.5">Объём, мл</p>
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
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold mb-3">
              График цены · {activeVol.label} мл
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

          {/* Цена за бины и базовая — ниже графика */}
          <div className="bg-surface rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">За Бины</span>
              <span className="inline-flex items-center gap-1.5 text-lg font-semibold tabular-nums text-amber-400/95">
                {drinkBeans}
                <CoffeeBeanIcon size={17} className="shrink-0" />
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
              <span className="text-sm text-muted">Базовая цена</span>
              <span className="text-base font-semibold">
                {formatPrice(
                  activeVol.basePrice ?? drink.basePrice,
                  country.currencySymbol,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Фиксированная кнопка над нижней навигацией (мобильные) */}
        <div
          className="lg:hidden fixed inset-x-0 z-[10035] px-4 pb-2 pointer-events-none"
          style={{
            bottom:
              "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div className="pointer-events-auto max-w-lg mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                setBought(false);
                setShowAddons(true);
              }}
            >
              <span className="flex flex-col items-center gap-0.5">
                <span className="font-semibold">Продолжить</span>
                <span className="text-xs font-normal opacity-90 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                  <span>{activeVol.label} мл</span>
                  <span>·</span>
                  <span>
                    {formatPrice(activeVol.price, country.currencySymbol)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 tabular-nums">
                    {drinkBeans}
                    <CoffeeBeanIcon size={14} className="shrink-0" />
                  </span>
                </span>
              </span>
            </Button>
          </div>
        </div>

        <div className="hidden lg:block px-4 mt-4">
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setBought(false);
              setShowAddons(true);
            }}
          >
            <span className="flex flex-col items-center gap-0.5">
              <span className="font-semibold">Продолжить</span>
              <span className="text-xs font-normal opacity-90 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                <span>{activeVol.label} мл</span>
                <span>·</span>
                <span>
                  {formatPrice(activeVol.price, country.currencySymbol)}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  {drinkBeans}
                  <CoffeeBeanIcon size={14} className="shrink-0" />
                </span>
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
        drinkNutrition={{
          calories: drink.calories,
          proteins: drink.proteins,
          fats: drink.fats,
          carbs: drink.carbs,
        }}
        onConfirm={confirmPurchase}
        confirming={buying}
        bought={bought}
      />
    </AuthGate>
  );
}

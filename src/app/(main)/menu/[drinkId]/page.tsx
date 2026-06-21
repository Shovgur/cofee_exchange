"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createDemoCoupon } from "@/lib/auth/demo-auth";
import { usePrices } from "@/contexts/PricesContext";
import {
  createMoneyPayment,
  fetchMenuItem,
  findLoyaltyItemId,
  LoyaltyApiError,
  purchaseCouponWithQuote,
  quoteBeanPurchase,
  quoteMoneyPurchase,
} from "@/lib/api/loyalty";
import {
  buildDrinkFromGroup,
  getPriceEntriesForDrinkRoute,
} from "@/lib/drinks/build-from-prices";
import {
  mapApiModifiersToGroups,
  type DrinkAddonGroup,
} from "@/lib/drinks/addons";
import { formatPrice, formatPriceChange, trendBg, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import AuthGate from "@/components/auth/AuthGate";
import DrinkAddonsSheet from "@/components/menu/DrinkAddonsSheet";
import CoffeeBeanIcon from "@/components/ui/CoffeeBeanIcon";
import dynamic from "next/dynamic";
import type { PriceTrend, VolumePrice } from "@/types";

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
  const { user, isDemo, purchaseDemoCoupon, refreshCoupons, refreshUserData } = useAuth();

  const { prices, menuItems, loading, error, flashMap, flashGen } = usePrices();

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
  const [addonGroups, setAddonGroups] = useState<DrinkAddonGroup[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const [animKey, setAnimKey] = useState(0);
  const [animTrend, setAnimTrend] = useState<PriceTrend | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
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

  const activeVol = useMemo(() => {
    if (!drink) return null;
    if (
      selectedVolume &&
      drink.volumes.find((v) => v.value === selectedVolume.value)
    ) {
      return selectedVolume;
    }
    return (
      drink.volumes[Math.floor(drink.volumes.length / 2)] ?? drink.volumes[0]
    );
  }, [drink, selectedVolume]);

  useEffect(() => {
    if (!showAddons || !drink || !activeVol) return;
    const loyaltyItemId =
      activeVol.loyaltyItemId ??
      findLoyaltyItemId(menuItems, drink.id, activeVol.value);
    if (!loyaltyItemId) {
      setAddonGroups([]);
      return;
    }
    let cancelled = false;
    fetchMenuItem(loyaltyItemId)
      .then((detail) => {
        if (!cancelled) {
          setAddonGroups(mapApiModifiersToGroups(detail.modifiers ?? []));
        }
      })
      .catch(() => {
        if (!cancelled) setAddonGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showAddons, drink, activeVol, menuItems]);

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

  if (error || !drink || !activeVol) {
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

  const TrendIcon =
    activeVol.trend === "up"
      ? TrendingUp
      : activeVol.trend === "down"
        ? TrendingDown
        : Minus;

  const drinkBeans = activeVol.priceBeans ?? 0;

  async function confirmPurchase(payload: {
    totalRub: number;
    totalBeans: number;
    labels: string[];
    paymentMethod: "card" | "beans";
    modifierIds: string[];
  }) {
    if (!user || !drink || !activeVol) return;
    setBuying(true);

    const loyaltyItemId =
      activeVol.loyaltyItemId ??
      findLoyaltyItemId(menuItems, drink.id, activeVol.value);

    if (!loyaltyItemId) {
      setBuying(false);
      alert("Не удалось определить позицию меню");
      return;
    }

    try {
      if (isDemo) {
        if (
          payload.paymentMethod === "beans" &&
          user.loyaltyPoints < payload.totalBeans
        ) {
          setBuying(false);
          alert("Недостаточно бинов на балансе");
          return;
        }

        const coupon = createDemoCoupon({
          drink,
          activeVol,
          country,
          totalRub: payload.totalRub,
          totalBeans: payload.totalBeans,
          paymentMethod: payload.paymentMethod,
          addonLabels: payload.labels,
        });

        purchaseDemoCoupon(
          coupon,
          payload.paymentMethod === "beans" ? payload.totalBeans : undefined,
        );

        setBuying(false);
        setBought(true);
        setTimeout(() => {
          setShowAddons(false);
          setBought(false);
          router.push("/coupons");
        }, 1500);
        return;
      }

      const body = {
        item_id: loyaltyItemId,
        modifier_ids: payload.modifierIds.length > 0 ? payload.modifierIds : undefined,
      };

      if (payload.paymentMethod === "beans") {
        const quote = await quoteBeanPurchase(body);
        await purchaseCouponWithQuote(quote.quote_id);
        await refreshCoupons();
        await refreshUserData();
      } else {
        const quote = await quoteMoneyPurchase(body);
        const payment = await createMoneyPayment(quote.quote_id);
        window.location.href = payment.confirmation_url;
        return;
      }

      setBuying(false);
      setBought(true);
      setTimeout(() => {
        setShowAddons(false);
        setBought(false);
        router.push("/coupons");
      }, 1500);
    } catch (err) {
      setBuying(false);
      const message =
        err instanceof LoyaltyApiError
          ? err.detail ?? err.message
          : "Не удалось оформить покупку";
      alert(message);
    }
  }

  return (
    <AuthGate fallbackMessage="Карточка напитка и возможность покупки доступны только авторизованным пользователям.">
      <div className="pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
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
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold leading-tight">
                    {drink.name}
                  </h1>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="flex flex-nowrap items-center justify-end gap-2">
                    <div
                      key={`pct-${animKey}`}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-0.5 text-xs font-medium",
                        trendBg(activeVol.trend),
                        animKey > 0 ? "dp-pct-in" : "",
                      )}
                    >
                      <TrendIcon size={11} />
                      {formatPriceChange(activeVol.change)}
                    </div>
                    <span
                      key={`price-rub-${animKey}`}
                      className={cn(
                        "text-lg font-bold leading-none tracking-tight whitespace-nowrap text-foreground",
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
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums text-orange">
                    {drinkBeans}
                    <CoffeeBeanIcon size={14} className="shrink-0" />
                  </span>
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
              График цены
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

          {drink.description ? (
            <div className="bg-surface rounded-3xl p-4">
              <h2 className="text-sm font-semibold mb-2">Описание</h2>
              <p className="text-sm leading-relaxed text-muted">
                {drink.description}
              </p>
            </div>
          ) : null}
        </div>

        {/* Fixed continue button with blur overlay (mobile) */}
        <div
          className="lg:hidden fixed inset-x-0 z-[10035]"
          style={{
            bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Blur fade above button */}
          <div
            className="h-16 w-full pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--tw-shadow-color, #F0E4D8))",
              backgroundImage:
                "linear-gradient(to bottom, rgba(240,228,216,0), rgba(240,228,216,0.97))",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 100%)",
            }}
          />
          <div className="pointer-events-auto px-4 max-w-lg mx-auto bg-bg pb-2">
            <Button
              fullWidth
              size="lg"
              onClick={() => {
                setBought(false);
                setShowAddons(true);
              }}
            >
              Продолжить
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
            Продолжить
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
        groups={addonGroups}
        onConfirm={confirmPurchase}
        confirming={buying}
        bought={bought}
      />
    </AuthGate>
  );
}

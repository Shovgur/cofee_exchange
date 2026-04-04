"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrices } from "@/contexts/PricesContext";
import { cn, formatPriceChange } from "@/lib/utils";
import type { Drink, DrinkCategory, PriceTrend, VolumePrice } from "@/types";

const ALL_TABS: {
  value: DrinkCategory | "all";
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "Все", emoji: "🍹" },
  { value: "coffee", label: "Кофе", emoji: "☕" },
  { value: "lemonade", label: "Лимонады", emoji: "🍋" },
  { value: "tea", label: "Чаи", emoji: "🍵" },
];

const CATEGORY_HEADER: Record<string, string> = {
  coffee: "☕ Кофе",
  lemonade: "🍋 Лимонады",
  tea: "🍵 Чаи",
};

function tabsForDrinks(drinks: Drink[]) {
  const has = (c: DrinkCategory) => drinks.some((d) => d.category === c);
  return ALL_TABS.filter(
    (t) => t.value === "all" || has(t.value as DrinkCategory),
  );
}

function TrendArrow({ trend }: { trend: PriceTrend }) {
  if (trend === "up")
    return <TrendingUp size={11} className="text-success shrink-0" />;
  if (trend === "down")
    return <TrendingDown size={11} className="text-danger  shrink-0" />;
  return <Minus size={11} className="text-muted shrink-0" />;
}

function VolumeCol({
  vol,
  flashing,
  flashGen,
}: {
  vol: VolumePrice;
  flashing: boolean;
  flashGen: number;
}) {
  const flashClass =
    vol.trend === "up"
      ? "price-flash-up"
      : vol.trend === "down"
        ? "price-flash-down"
        : "price-flash-neutral";

  return (
    <div
      key={flashing ? `${vol.value}-${flashGen}` : vol.value}
      className={cn(
        "flex flex-col items-center min-w-[52px] px-1 py-0.5",
        flashing && flashClass,
      )}
    >
      <span className="text-[10px] text-muted mb-0.5">{vol.label}</span>
      <span className="text-sm font-bold leading-tight">
        {Math.round(vol.price)} ₽
      </span>
      <div
        className={cn(
          "flex items-center gap-0.5 mt-0.5 text-[10px] font-medium",
          vol.trend === "up"
            ? "text-success"
            : vol.trend === "down"
              ? "text-danger"
              : "text-muted",
        )}
      >
        <TrendArrow trend={vol.trend} />
        <span>{formatPriceChange(vol.change)}</span>
      </div>
    </div>
  );
}

function DrinkTile({
  drink,
  isLocked,
  flashTrend,
  flashGen,
}: {
  drink: Drink;
  isLocked: boolean;
  flashTrend: PriceTrend | undefined;
  flashGen: number;
}) {
  const tileFlashClass =
    flashTrend === "up"
      ? "tile-update-up"
      : flashTrend === "down"
        ? "tile-update-down"
        : flashTrend
          ? "tile-update-neutral"
          : "";

  return (
    <Link
      href={isLocked ? "/auth/login" : `/menu/${drink.id}`}
      key={flashTrend ? `${drink.id}-${flashGen}` : drink.id}
      className={cn(
        "flex items-center gap-3 bg-surface rounded-2xl p-3.5",
        "active:scale-[0.98] transition-all hover:bg-surface-el group",
        flashTrend && tileFlashClass,
      )}
    >
      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-el">
        {drink.photoUrl ? (
          <Image
            src={drink.photoUrl}
            alt={drink.name}
            fill
            className="object-cover"
            unoptimized
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {drink.category === "coffee"
              ? "☕"
              : drink.category === "lemonade"
                ? "🍋"
                : "🍵"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm leading-tight truncate">
            {drink.name}
          </span>
          {isLocked && <Lock size={11} className="text-muted shrink-0" />}
        </div>
        <span className="text-xs text-muted">{drink.volume}</span>
      </div>

      <div className="flex items-start gap-1 shrink-0">
        {drink.volumes.map((vol) => (
          <VolumeCol
            key={flashTrend ? `${vol.value}-${flashGen}` : vol.value}
            vol={vol}
            flashing={!!flashTrend}
            flashGen={flashGen}
          />
        ))}
      </div>
    </Link>
  );
}

function DrinkSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-surface rounded-2xl p-3.5 animate-pulse">
      <div className="w-16 h-16 rounded-xl bg-surface-el shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-el rounded w-2/3" />
        <div className="h-3 bg-surface-el rounded w-1/3" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-[52px] h-12 bg-surface-el rounded" />
        ))}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { country } = useCountry();
  const { user } = useAuth();
  const { drinks, loading, error, flashMap, flashGen } = usePrices();

  const [category, setCategory] = useState<DrinkCategory | "all">("all");

  const categoryTabs = useMemo(() => tabsForDrinks(drinks), [drinks]);

  useEffect(() => {
    if (category !== "all" && !drinks.some((d) => d.category === category)) {
      setCategory("all");
    }
  }, [drinks, category]);

  const filtered =
    category === "all" ? drinks : drinks.filter((d) => d.category === category);

  const groups: { key: DrinkCategory; items: Drink[] }[] = [];
  for (const key of ["coffee", "lemonade", "tea"] as DrinkCategory[]) {
    const items = filtered.filter((d) => d.category === key);
    if (items.length > 0) groups.push({ key, items });
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-3xl font-bold">Меню</h1>
            <p className="text-xs lg:text-sm text-muted mt-0.5">
              {country.name} · {loading ? "…" : `${filtered.length} позиций`}
            </p>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-select">
          {categoryTabs.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                category === value
                  ? "bg-orange text-white"
                  : "bg-surface-el text-muted hover:text-white",
              )}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8 space-y-6 mt-3">
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <DrinkSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center text-muted py-16">Нет позиций</div>
        )}

        {!loading &&
          groups.map(({ key, items }) => (
            <section key={key}>
              <h2 className="text-base font-bold mb-2 px-0.5">
                {CATEGORY_HEADER[key]}
              </h2>
              <div className="space-y-2">
                {items.map((drink) => (
                  <DrinkTile
                    key={drink.id}
                    drink={drink}
                    isLocked={!user}
                    flashTrend={flashMap.get(drink.id)}
                    flashGen={flashGen}
                  />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

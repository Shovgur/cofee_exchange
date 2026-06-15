"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  Search,
  X,
} from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePrices } from "@/contexts/PricesContext";
import { cn, formatPriceChange, formatPrice } from "@/lib/utils";
import type { Drink, DrinkCategory, PriceTrend, VolumePrice } from "@/types";

type MenuTab = DrinkCategory | "all" | "secret";

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

const SECRET_TAB = {
  value: "secret" as const,
  label: "Secret",
  emoji: "🔒",
};

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
  currencySymbol,
  flashing,
  flashGen,
}: {
  vol: VolumePrice;
  currencySymbol: string;
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
      <span className="text-[10px] text-muted mb-0.5 tabular-nums">
        {vol.label}
      </span>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-sm font-bold leading-tight text-foreground",
            flashing &&
              (vol.trend === "up"
                ? "dp-price-up"
                : vol.trend === "down"
                  ? "dp-price-down"
                  : "dp-price-neutral"),
          )}
        >
          {formatPrice(vol.price, currencySymbol)}
        </span>
      </div>
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
  currencySymbol,
  flashTrend,
  flashGen,
}: {
  drink: Drink;
  isLocked: boolean;
  currencySymbol: string;
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
        <div className="flex items-start gap-1.5">
          <span className="font-semibold text-sm leading-snug line-clamp-2 break-words">
            {drink.name}
          </span>
          {isLocked && (
            <Lock size={11} className="text-muted shrink-0 mt-0.5" />
          )}
        </div>
      </div>

      <div className="flex items-start gap-1 shrink-0">
        {drink.volumes.map((vol) => (
          <VolumeCol
            key={flashTrend ? `${vol.value}-${flashGen}` : vol.value}
            vol={vol}
            currencySymbol={currencySymbol}
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

function SecretMenuPanel() {
  return (
    <div className="rounded-2xl border border-orange/35 bg-surface-el px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/15">
        <Lock size={26} className="text-orange" />
      </div>
      <h2 className="text-lg font-semibold">Secret Menu</h2>
      <p className="text-sm text-muted mt-2 max-w-xs mx-auto leading-relaxed">
        Эксклюзивные позиции только за Бины. Раздел скоро откроется в приложении.
      </p>
      <div className="mt-5 inline-flex px-3 py-1.5 rounded-lg bg-surface-el">
        <span className="text-xs font-medium text-muted">Скоро</span>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { country } = useCountry();
  const { user } = useAuth();
  const {
    drinks,
    loading,
    error,
    flashMap,
    flashGen,
  } = usePrices();

  const [category, setCategory] = useState<MenuTab>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categoryTabs = useMemo(
    () => [...tabsForDrinks(drinks), SECRET_TAB],
    [drinks],
  );

  useEffect(() => {
    if (category === "secret") return;
    if (category !== "all" && !drinks.some((d) => d.category === category)) {
      setCategory("all");
    }
  }, [drinks, category]);

  const filtered =
    category === "secret"
      ? []
      : category === "all"
        ? drinks
        : drinks.filter((d) => d.category === category);

  const groups: { key: DrinkCategory; items: Drink[] }[] = [];
  for (const key of ["coffee", "lemonade", "tea"] as DrinkCategory[]) {
    const items = filtered.filter((d) => d.category === key);
    if (items.length > 0) groups.push({ key, items });
  }

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return drinks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.nameShort.toLowerCase().includes(q),
    );
  }, [drinks, searchQuery]);

  useEffect(() => {
    if (searchOpen) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
    setSearchQuery("");
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col lg:flex-none lg:min-h-full">
      {/* Прокрутка только у <main>; вложенный overflow-y ломал sticky табов */}
      <div className="flex w-full flex-col">
        {/* Шапка убрана — только табы */}

        <div
          className={cn(
            "max-lg:sticky max-lg:top-0 z-[10025] shrink-0 w-full border-b border-border/60 max-lg:bg-bg bg-bg/95 px-4 lg:px-8 py-2.5 max-lg:shadow-[0_6px_20px_-12px_rgba(47,36,28,0.12)] lg:backdrop-blur-lg lg:shadow-none lg:supports-[backdrop-filter]:bg-bg/85 lg:static lg:z-auto",
          )}
        >
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название напитка…"
                  enterKeyHint="search"
                  className="w-full rounded-xl border border-border bg-surface-el py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-orange/50 focus:outline-none focus:ring-1 focus:ring-orange/35"
                />
              </div>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Закрыть поиск"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-el text-muted transition-colors hover:bg-surface-ov hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="touch-pan-x flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 no-select">
                {categoryTabs.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-transparent",
                      category === value
                        ? value === "secret"
                          ? "bg-surface-el text-orange border-orange/35 shadow-[0_0_0_1px_rgba(226,100,2,0.28)]"
                          : "bg-orange text-white"
                        : value === "secret"
                          ? "bg-surface-el text-muted border-orange/15 hover:border-orange/30 hover:text-foreground"
                          : "bg-surface-el text-muted hover:text-foreground",
                    )}
                  >
                    <span>{emoji}</span>
                    {label === "Secret" ? "Secret Menu" : label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Поиск напитка"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-el text-muted transition-colors hover:bg-surface-ov hover:text-foreground"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 lg:px-8 pb-nav-safe space-y-6 pt-4 lg:pb-8">
          {searchOpen ? (
            <>
              {!searchQuery.trim() ? (
                <p className="py-8 text-center text-sm text-muted">
                  Введите название напитка
                </p>
              ) : searchResults.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Ничего не найдено
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((drink) => (
                    <DrinkTile
                      key={drink.id}
                      drink={drink}
                      isLocked={!user}
                      currencySymbol={country.currencySymbol}
                      flashTrend={flashMap.get(drink.id)}
                      flashGen={flashGen}
                    />
                  ))}
                </div>
              )}
            </>
          ) : category === "secret" ? (
            <SecretMenuPanel />
          ) : (
            <>
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
                          currencySymbol={country.currencySymbol}
                          flashTrend={flashMap.get(drink.id)}
                          flashGen={flashGen}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

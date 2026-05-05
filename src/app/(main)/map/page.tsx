"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { X, Navigation, Clock, Star, MapPin, Search } from "lucide-react";
import { getAllShops, isShopOpen } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import type { CoffeeShop } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
      <span className="text-muted text-sm">Загрузка карты…</span>
    </div>
  ),
});

function ShopCard({
  shop,
  selected,
  onClick,
  compact = false,
}: {
  shop: CoffeeShop;
  selected?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const open = isShopOpen(shop);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-3.5 transition-all border",
        selected
          ? "bg-orange/10 border-orange/30"
          : "bg-surface-el border-transparent hover:border-border",
      )}
    >
      {!compact && shop.photoUrl && (
        <div className="relative h-28 rounded-xl overflow-hidden mb-3 bg-surface-ov">
          <Image
            src={shop.photoUrl}
            alt={shop.name}
            fill
            className="object-cover"
            unoptimized
            sizes="320px"
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-snug truncate">
            {shop.name}
          </p>
          <p className="text-xs text-muted mt-0.5 truncate">{shop.address}</p>
        </div>
        <div
          className={cn(
            "flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
            open ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              open ? "bg-success" : "bg-danger",
            )}
          />
          {open ? "Открыто" : "Закрыто"}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Star size={11} className="text-orange fill-orange" />
          <span>{shop.rating}</span>
        </div>
        {shop.workHours[0] && (
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock size={11} />
            <span>
              {shop.workHours[0].open}–{shop.workHours[0].close}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

const DEFAULT_CENTER: [number, number] = [55.757, 37.617];

export default function MapPage() {
  const shops = useMemo(() => getAllShops(), []);
  const [selected, setSelected] = useState<CoffeeShop | null>(null);
  const [search, setSearch] = useState("");

  function openInNavigator(shop: CoffeeShop) {
    window.open(`https://maps.google.com/?q=${shop.lat},${shop.lng}`, "_blank");
  }

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    /* Desktop: flex row (list | map). Mobile: only map with bottom sheet */
    <div
      className={cn(
        "flex flex-1 shrink-0 flex-col overflow-hidden",
        "min-h-[calc(100dvh-5rem)] lg:grid lg:h-[100vh] lg:max-h-[100vh] lg:min-h-0 lg:min-w-0",
        "lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden",
      )}
    >
      {/* ── Desktop left panel: shop list ─────────────────── */}
      <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden border-r border-border bg-bg lg:flex lg:flex-col">
        <div className="shrink-0 px-5 pt-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold mb-3">Карта</h1>
          <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5 border border-border">
            <Search size={15} className="text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Поиск кофейни…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted"
            />
          </div>
          <p className="text-xs text-muted mt-2">
            Все страны · {filteredShops.length}{" "}
            {filteredShops.length === 1 ? "кофейня" : "кофеен"}
          </p>
        </div>

        <div className="sidebar-scroll h-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 space-y-2">
          {filteredShops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              selected={selected?.id === shop.id}
              onClick={() => setSelected(shop)}
            />
          ))}
          {filteredShops.length === 0 && (
            <p className="text-center text-muted text-sm py-8">
              Ничего не найдено
            </p>
          )}
        </div>

        {/* Selected shop actions */}
        {selected && (
          <div className="shrink-0 px-4 py-4 border-t border-border bg-surface/50">
            <p className="text-sm font-semibold truncate mb-3">
              {selected.name}
            </p>
            <Button fullWidth onClick={() => openInNavigator(selected)}>
              <Navigation size={15} />
              Открыть в навигаторе
            </Button>
          </div>
        )}
      </aside>

      {/* ── Map area: absolute fill — иначе Leaflet получает ~высоту контента, а не колонки ─ */}
      <div className="relative min-h-0 min-w-0 flex-1 lg:min-h-0">
        <div className="absolute inset-0 z-0 min-h-0">
          <MapView
            shops={shops}
            onShopClick={(shop) => setSelected(shop)}
            center={DEFAULT_CENTER}
          />
        </div>

        <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 lg:hidden">
          <div className="inline-flex max-w-full items-center rounded-2xl border border-border bg-bg/80 px-4 py-2 backdrop-blur-md">
            <span className="truncate text-sm font-medium">
              Все страны · {shops.length} кофеен
            </span>
          </div>
        </div>

        {/* Desktop: selected shop floating card (top-right) */}
        {selected && (
          <div className="hidden lg:block absolute top-4 right-4 z-20 w-72">
            <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-border">
              {selected.photoUrl && (
                <div className="relative h-28 rounded-xl overflow-hidden mb-3 bg-surface-el">
                  <Image
                    src={selected.photoUrl}
                    alt={selected.name}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="320px"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm leading-snug flex-1 mr-2">
                  {selected.name}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-surface-el transition-colors flex-shrink-0"
                >
                  <X size={14} className="text-muted" />
                </button>
              </div>
              <p className="text-xs text-muted mb-3">{selected.address}</p>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                    isShopOpen(selected)
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isShopOpen(selected) ? "bg-success" : "bg-danger",
                    )}
                  />
                  {isShopOpen(selected) ? "Открыто" : "Закрыто"}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Star size={11} className="text-orange fill-orange" />
                  {selected.rating}
                </div>
              </div>
              <Button
                fullWidth
                size="sm"
                onClick={() => openInNavigator(selected)}
              >
                <Navigation size={14} />
                Открыть в навигаторе
              </Button>
            </div>
          </div>
        )}

        {/* Mobile: bottom sheet */}
        {selected && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-20">
            <div className="bg-surface rounded-t-3xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-2xl border-t border-border">
              {selected.photoUrl && (
                <div className="relative h-32 rounded-2xl overflow-hidden mb-4 bg-surface-el">
                  <Image
                    src={selected.photoUrl}
                    alt={selected.name}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="512px"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-3">
                  <h2 className="font-semibold text-base leading-tight">
                    {selected.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin size={12} className="text-muted" />
                    <span className="text-xs text-muted">
                      {selected.address}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl bg-surface-el hover:bg-surface-ov transition-colors flex-shrink-0"
                >
                  <X size={16} className="text-muted" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    isShopOpen(selected)
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isShopOpen(selected) ? "bg-success" : "bg-danger",
                    )}
                  />
                  {isShopOpen(selected) ? "Открыто" : "Закрыто"}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Star size={12} className="text-orange fill-orange" />
                  <span>{selected.rating}</span>
                </div>
              </div>
              <div className="space-y-1.5 mb-5">
                {selected.workHours.map((wh, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Clock size={13} className="text-muted flex-shrink-0" />
                    <span className="text-muted">{wh.days}:</span>
                    <span>
                      {wh.open} — {wh.close}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                fullWidth
                size="lg"
                onClick={() => openInNavigator(selected)}
              >
                <Navigation size={16} />
                Открыть в навигаторе
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

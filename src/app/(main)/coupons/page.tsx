"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import AuthGate from "@/components/auth/AuthGate";
import CouponDetailModal from "@/components/coupons/CouponDetailModal";
import Badge from "@/components/ui/Badge";
import {
  cn,
  couponStatusLabel,
  couponStatusColor,
  formatDateTime,
} from "@/lib/utils";
import type { Coupon, CouponStatus } from "@/types";
import { Ticket, Calendar, Clock, Rocket } from "lucide-react";

type FilterTab = "active" | "reserved" | "history";

const FILTERS: { value: FilterTab; label: string }[] = [
  { value: "active", label: "Активные" },
  { value: "reserved", label: "Зарезервированные" },
  { value: "history", label: "История" },
];

const HISTORY_STATUSES: CouponStatus[] = ["used", "expired", "cancelled"];

function couponMatchesFilter(coupon: Coupon, filter: FilterTab): boolean {
  if (filter === "history") return HISTORY_STATUSES.includes(coupon.status);
  return coupon.status === filter;
}

function expiryLabel(expiresAt: string): { text: string; urgent: boolean } {
  const now = Date.now();
  const end = new Date(expiresAt).getTime();
  const diffMs = end - now;
  if (diffMs <= 0) return { text: "Истёк", urgent: true };
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 24) {
    const h = Math.floor(diffH);
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${h}ч ${m}м`, urgent: true };
  }
  const days = Math.ceil(diffH / 24);
  return { text: `${days} дн.`, urgent: days <= 3 };
}

function DrinkEmoji({ category }: { category: string }) {
  if (category === "coffee") return <>☕</>;
  if (category === "lemonade") return <>🍋</>;
  return <>🍵</>;
}

function canOpenDetail(status: CouponStatus): boolean {
  return status === "active" || status === "reserved" || status === "used";
}

export default function CouponsPage() {
  const { coupons, refreshCoupons } = useAuth();
  const { country } = useCountry();
  const [filter, setFilter] = useState<FilterTab>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void refreshCoupons();
  }, [refreshCoupons]);

  const countryCoupons = coupons.filter((c) => c.countryId === country.id);
  const visible = countryCoupons.filter((c) => couponMatchesFilter(c, filter));
  const activeCount = countryCoupons.filter(
    (c) => c.status === "active",
  ).length;

  return (
    <AuthGate fallbackMessage="Ваши купоны доступны только после входа в аккаунт.">
      <div>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md pt-4 pb-2 px-4 lg:px-8 lg:pt-8 shadow-[0_1px_0_0_rgba(196,176,154,0.4)]">
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl lg:text-3xl font-bold">Купоны</h1>
            {activeCount > 0 && (
              <span className="text-xs bg-orange/20 text-orange px-2.5 py-1 rounded-full font-medium">
                {activeCount} активных
              </span>
            )}
          </div>

          <div className="touch-pan-x flex gap-2 overflow-x-auto pb-1 no-select">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  filter === value
                    ? "bg-orange text-white"
                    : "bg-surface-el text-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-4 pt-2 lg:grid-cols-2 lg:px-8 lg:pb-8">
          {visible.length === 0 && (
            <div className="lg:col-span-2 flex flex-col items-center gap-4 py-16 text-center">
              <Ticket size={40} className="text-muted" />
              <div>
                <p className="font-medium">
                  {filter === "history" ? "История пуста" : "Нет купонов"}
                </p>
                <p className="text-sm text-muted mt-1">
                  {filter === "active"
                    ? "Купите напиток в разделе Меню"
                    : filter === "reserved"
                      ? "Нет зарезервированных купонов"
                      : "Использованные и просроченные купоны появятся здесь"}
                </p>
              </div>
            </div>
          )}

          {visible.map((coupon) => (
            <button
              key={coupon.id}
              onClick={() =>
                canOpenDetail(coupon.status) && setSelectedId(coupon.id)
              }
              className={cn(
                "w-full text-left bg-surface rounded-2xl p-4 transition-all",
                canOpenDetail(coupon.status) &&
                  "active:scale-[0.98] hover:bg-surface-el",
                !canOpenDetail(coupon.status) && "opacity-60 cursor-default",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-el flex items-center justify-center text-2xl flex-shrink-0">
                  {coupon.isPreorder ? (
                    <Rocket size={22} className="text-orange" />
                  ) : (
                    <DrinkEmoji category={coupon.category} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">
                      {coupon.drinkName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {coupon.isPreorder && (
                        <Badge className="bg-orange/15 text-orange border border-orange/25">
                          Предзаказ
                        </Badge>
                      )}
                      <Badge className={couponStatusColor(coupon.status)}>
                        {couponStatusLabel(coupon.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="font-medium text-foreground">
                      {Math.round(coupon.purchasePrice)} {coupon.currencySymbol}
                      {coupon.volumeLabel && (
                        <span className="text-muted font-normal ml-1">
                          · {coupon.volumeLabel}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDateTime(coupon.purchasedAt)}
                    </span>
                  </div>
                  {coupon.isPreorder &&
                    coupon.saleStartsAt &&
                    coupon.status === "active" && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-orange">
                        <Rocket size={11} />
                        <span>
                          Активируется{" "}
                          <span className="font-medium">
                            {new Date(coupon.saleStartsAt).toLocaleDateString(
                              "ru-RU",
                              { day: "numeric", month: "long" },
                            )}
                          </span>
                        </span>
                      </div>
                    )}
                  {!coupon.isPreorder &&
                    (coupon.status === "active" ||
                      coupon.status === "reserved") &&
                    (() => {
                      const { text, urgent } = expiryLabel(coupon.expiresAt);
                      return (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted">
                          <Clock
                            size={11}
                            className={urgent ? "text-danger" : ""}
                          />
                          <span>
                            {coupon.status === "reserved"
                              ? "Зарезервирован · "
                              : "Действует ещё "}
                            <span
                              className={cn(
                                "font-medium",
                                urgent ? "text-danger" : "text-orange",
                              )}
                            >
                              {text}
                            </span>
                          </span>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <CouponDetailModal
        couponId={selectedId}
        country={country}
        onClose={() => setSelectedId(null)}
      />
    </AuthGate>
  );
}

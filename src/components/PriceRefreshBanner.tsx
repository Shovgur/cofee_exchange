"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { PRICES_POLL_INTERVAL_MS } from "@/contexts/PricesContext";
import { cn } from "@/lib/utils";

type Variant = "menu" | "tv";

/** «через N секунд» — корректное склонение */
function secondsForm(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "секунду";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "секунды";
  return "секунд";
}

export function PriceRefreshBanner({
  secondsUntilNextPoll,
  loading,
  variant,
}: {
  secondsUntilNextPoll: number | null;
  loading: boolean;
  variant: Variant;
}) {
  const intervalSec = PRICES_POLL_INTERVAL_MS / 1000;
  const remainingPct =
    secondsUntilNextPoll != null
      ? Math.max(0, Math.min(100, (secondsUntilNextPoll / intervalSec) * 100))
      : 0;

  const isTv = variant === "tv";
  const showCountdown = secondsUntilNextPoll != null;
  const spinUrgent = showCountdown && secondsUntilNextPoll <= 3;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden shadow-lg",
        isTv
          ? "border-orange/30 bg-gradient-to-br from-orange/[0.12] via-white/[0.04] to-transparent px-[clamp(0.85rem,2vw,1.25rem)] py-[clamp(0.75rem,2vw,1.1rem)]"
          : "border-orange/25 bg-gradient-to-br from-orange/[0.08] via-surface-el/80 to-surface/90 px-3.5 py-3 lg:px-4 lg:py-3.5",
      )}
      role="status"
      aria-live="polite"
      aria-label={
        showCountdown
          ? `Следующее обновление цен через ${secondsUntilNextPoll} ${secondsForm(secondsUntilNextPoll)}`
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 rounded-xl flex items-center justify-center",
            isTv
              ? "size-[clamp(2.25rem,5vw,3rem)] bg-orange/20"
              : "size-11 bg-orange/15",
            spinUrgent &&
              "ring-2 ring-orange/40 ring-offset-2 ring-offset-transparent",
          )}
        >
          <RefreshCw
            className={cn(
              "text-orange",
              isTv ? "size-[clamp(1.1rem,2.5vw,1.5rem)]" : "size-5",
              spinUrgent && "animate-spin",
            )}
            style={spinUrgent ? { animationDuration: "0.85s" } : undefined}
          />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p
            className={cn(
              "font-semibold text-white/90 leading-tight tracking-tight",
              isTv
                ? "text-[clamp(0.85rem,1.8vw,1.15rem)]"
                : "text-sm lg:text-[0.95rem]",
            )}
          >
            Следующее обновление цен
          </p>

          {loading && !showCountdown ? (
            <>
              <p
                className={cn(
                  "text-white/45 mt-1",
                  isTv
                    ? "text-[clamp(0.7rem,1.5vw,0.95rem)]"
                    : "text-xs lg:text-sm",
                )}
              >
                Загружаем котировки…
              </p>
              <div
                className={cn(
                  "mt-2.5 h-1.5 rounded-full bg-black/30 overflow-hidden",
                  !isTv && "bg-black/20",
                )}
              >
                <div className="price-refresh-bar-indeterminate h-full rounded-full bg-orange/50" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-1">
                <span
                  className={cn(
                    "text-white/50 tabular-nums",
                    isTv
                      ? "text-[clamp(0.7rem,1.5vw,0.95rem)]"
                      : "text-xs lg:text-sm",
                  )}
                >
                  через
                </span>
                <motion.span
                  key={secondsUntilNextPoll ?? "—"}
                  initial={{ opacity: 0.65, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 28,
                  }}
                  className={cn(
                    "font-bold text-orange tabular-nums drop-shadow-[0_0_12px_rgba(251,100,21,0.35)]",
                    isTv
                      ? "text-[clamp(1.75rem,4.5vw,3rem)] leading-none"
                      : "text-2xl lg:text-3xl leading-none",
                  )}
                >
                  {showCountdown ? secondsUntilNextPoll : "—"}
                </motion.span>
                <span
                  className={cn(
                    "text-white/50 font-medium tabular-nums",
                    isTv
                      ? "text-[clamp(0.85rem,2vw,1.2rem)]"
                      : "text-base lg:text-lg",
                  )}
                >
                  {showCountdown ? secondsForm(secondsUntilNextPoll) : ""}
                </span>
              </div>
              <p
                className={cn(
                  "text-white/40 mt-1.5",
                  isTv
                    ? "text-[clamp(0.65rem,1.35vw,0.88rem)]"
                    : "text-[11px] lg:text-xs",
                )}
              ></p>
            </>
          )}
        </div>
      </div>

      {showCountdown && (
        <div
          className={cn(
            "mt-3 rounded-full bg-black/25 overflow-hidden",
            isTv ? "h-[clamp(0.35rem,0.9vw,0.5rem)]" : "h-2",
          )}
        >
          <motion.div
            className="price-refresh-bar-fill h-full rounded-full min-w-[6px]"
            initial={false}
            animate={{ width: `${remainingPct}%` }}
            transition={{
              type: "tween",
              ease: [0.4, 0, 0.2, 1],
              duration: 0.45,
            }}
          />
        </div>
      )}
    </div>
  );
}

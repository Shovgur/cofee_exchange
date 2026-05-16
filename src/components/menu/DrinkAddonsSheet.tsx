"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CreditCard } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import {
  DRINK_ADDON_GROUPS,
  type DrinkAddonGroup,
  type DrinkAddonNutrition,
} from "@/lib/mock-data/drink-addons";
import Button from "@/components/ui/Button";
import CoffeeBeanIcon from "@/components/ui/CoffeeBeanIcon";

function BeanAmount({
  beans,
  iconSize = 11,
  className,
  positivePrefix = false,
}: {
  beans: number;
  iconSize?: number;
  className?: string;
  positivePrefix?: boolean;
}) {
  const text = positivePrefix && beans > 0 ? `+${beans}` : `${beans}`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 tabular-nums text-orange",
        className,
      )}
    >
      {text}
      <CoffeeBeanIcon size={iconSize} className="shrink-0" />
    </span>
  );
}

function defaultSingleSelection(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const g of DRINK_ADDON_GROUPS) {
    if (g.type !== "single") continue;
    const free = g.options.find((o) => o.priceRub === 0 && o.priceBeans === 0);
    m[g.id] = (free ?? g.options[0]).id;
  }
  return m;
}

function defaultMultiSelection(): Set<string> {
  const s = new Set<string>();
  for (const g of DRINK_ADDON_GROUPS) {
    if (g.type !== "multi") continue;
    for (const o of g.options) {
      if (o.priceRub === 0 && o.priceBeans === 0) s.add(o.id);
    }
  }
  return s;
}

function optionById(group: DrinkAddonGroup, id: string) {
  return group.options.find((o) => o.id === id);
}

function sumNutrition(sel: {
  singleSel: Record<string, string>;
  multiSel: Set<string>;
}): DrinkAddonNutrition {
  let calories = 0;
  let proteins = 0;
  let fats = 0;
  let carbs = 0;
  for (const g of DRINK_ADDON_GROUPS) {
    if (g.type === "single") {
      const o = optionById(g, sel.singleSel[g.id] ?? "");
      const n = o?.nutrition;
      if (n) {
        calories += n.calories;
        proteins += n.proteins;
        fats += n.fats;
        carbs += n.carbs;
      }
    } else {
      for (const o of g.options) {
        if (!sel.multiSel.has(o.id)) continue;
        const n = o.nutrition;
        if (n) {
          calories += n.calories;
          proteins += n.proteins;
          fats += n.fats;
          carbs += n.carbs;
        }
      }
    }
  }
  return { calories, proteins, fats, carbs };
}

export interface DrinkNutritionBase {
  calories: number;
  proteins: number;
  fats: number;
  carbs: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  drinkName: string;
  volumeLabel: string;
  basePriceRub: number;
  baseBeans: number;
  currencySymbol: string;
  drinkNutrition: DrinkNutritionBase;
  onConfirm: (payload: {
    totalRub: number;
    totalBeans: number;
    labels: string[];
    paymentMethod: "card" | "beans";
    temperatureId: string;
    milkId: string;
    singleSel: Record<string, string>;
    multiSel: string[];
  }) => void;
  confirming: boolean;
  bought: boolean;
}

export default function DrinkAddonsSheet({
  open,
  onClose,
  drinkName,
  volumeLabel,
  basePriceRub,
  baseBeans,
  currencySymbol,
  drinkNutrition,
  onConfirm,
  confirming,
  bought,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [singleSel, setSingleSel] = useState<Record<string, string>>(
    defaultSingleSelection,
  );
  const [multiSel, setMultiSel] = useState<Set<string>>(defaultMultiSelection);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "beans" | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<string>(DRINK_ADDON_GROUPS[0].id);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setSingleSel(defaultSingleSelection());
    setMultiSel(defaultMultiSelection());
    setPaymentMethod(null);
    setActiveTab(DRINK_ADDON_GROUPS[0].id);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const { addonRub, addonBeans, labels } = useMemo(() => {
    let ar = 0;
    let ab = 0;
    const ls: string[] = [];
    for (const g of DRINK_ADDON_GROUPS) {
      if (g.type === "single") {
        const id = singleSel[g.id];
        const o = optionById(g, id!);
        if (o) {
          ar += o.priceRub;
          ab += o.priceBeans;
          ls.push(o.name);
        }
      } else {
        for (const o of g.options) {
          if (!multiSel.has(o.id)) continue;
          ar += o.priceRub;
          ab += o.priceBeans;
          ls.push(o.name);
        }
      }
    }
    return { addonRub: ar, addonBeans: ab, labels: ls };
  }, [singleSel, multiSel]);

  const addonNutrition = useMemo(
    () => sumNutrition({ singleSel, multiSel }),
    [singleSel, multiSel],
  );

  const totalNutrition = useMemo(() => {
    return {
      calories: drinkNutrition.calories + addonNutrition.calories,
      proteins: drinkNutrition.proteins + addonNutrition.proteins,
      fats: drinkNutrition.fats + addonNutrition.fats,
      carbs: drinkNutrition.carbs + addonNutrition.carbs,
    };
  }, [drinkNutrition, addonNutrition]);

  const totalRub = basePriceRub + addonRub;
  const totalBeans = baseBeans + addonBeans;

  function toggleMultiOption(optionId: string) {
    setMultiSel((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  const activeGroup = DRINK_ADDON_GROUPS.find((g) => g.id === activeTab);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="drink-addons-ui"
          className="fixed inset-0 z-[10070] flex flex-col justify-end lg:justify-center lg:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => !confirming && !bought && onClose()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="addons-sheet-title"
            className={cn(
              "relative z-10 flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col overflow-hidden bg-surface shadow-2xl lg:mx-auto lg:max-h-[85vh] lg:rounded-3xl",
              "rounded-t-3xl border border-border border-b-0 lg:border-b",
            )}
            initial={{ y: "100%", opacity: 0.96 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.96 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 360,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2
                id="addons-sheet-title"
                className="text-lg font-semibold leading-tight"
              >
                Настрой свой напиток
              </h2>
              <button
                type="button"
                onClick={() => !confirming && !bought && onClose()}
                className="flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-surface-el active:bg-surface-ov"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>

            {/* Modifier tabs */}
            {!bought && (
              <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 border-b border-border/60 no-scrollbar">
                {DRINK_ADDON_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setActiveTab(group.id)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      activeTab === group.id
                        ? "bg-orange text-white shadow-sm"
                        : "bg-surface-el text-muted hover:text-foreground",
                    )}
                  >
                    {group.title}
                  </button>
                ))}
              </div>
            )}

            {/* Options list */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              {bought ? (
                <motion.div
                  className="flex flex-col items-center gap-4 py-10"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                    <Check size={32} className="text-success" />
                  </div>
                  <p className="text-lg font-semibold">Куплено!</p>
                  <p className="text-center text-sm text-muted">
                    Купон добавлен в раздел «Купоны»
                  </p>
                </motion.div>
              ) : (
                activeGroup && (
                  <motion.div
                    key={activeGroup.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="space-y-2"
                  >
                    {activeGroup.options.map((opt) => {
                      const isSingle = activeGroup.type === "single";
                      const checked = isSingle
                        ? singleSel[activeGroup.id] === opt.id
                        : multiSel.has(opt.id);

                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                            checked
                              ? "border-orange/40 bg-orange/10"
                              : "border-border bg-surface-el hover:border-border hover:bg-surface-ov",
                          )}
                        >
                          <input
                            type={isSingle ? "radio" : "checkbox"}
                            name={
                              isSingle ? `addon-${activeGroup.id}` : undefined
                            }
                            checked={checked}
                            onChange={() => {
                              if (isSingle) {
                                setSingleSel((s) => ({
                                  ...s,
                                  [activeGroup.id]: opt.id,
                                }));
                              } else {
                                toggleMultiOption(opt.id);
                              }
                            }}
                            className="h-4 w-4 shrink-0 rounded border-border accent-orange"
                          />
                          <span className="min-w-0 flex-1 text-sm font-medium">
                            {opt.name}
                          </span>
                          {(opt.priceRub !== 0 || opt.priceBeans !== 0) && (
                            <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                              <span className="font-semibold tabular-nums text-foreground">
                                {opt.priceRub === 0
                                  ? `0 ${currencySymbol}`
                                  : `+${opt.priceRub} ${currencySymbol}`}
                              </span>
                              <BeanAmount
                                beans={opt.priceBeans}
                                iconSize={12}
                                positivePrefix
                              />
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </motion.div>
                )
              )}
            </div>

            {!bought && (
              <div className="shrink-0 border-t border-border bg-surface px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
                {/* КБЖУ */}
                <div className="mb-4 rounded-2xl bg-surface-el p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    КБЖУ на порцию
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        label: "Кал.",
                        value: `${Math.round(totalNutrition.calories)}`,
                      },
                      {
                        label: "Белки",
                        value: `${totalNutrition.proteins.toFixed(1)}г`,
                      },
                      {
                        label: "Жиры",
                        value: `${totalNutrition.fats.toFixed(1)}г`,
                      },
                      {
                        label: "Углев.",
                        value: `${totalNutrition.carbs.toFixed(1)}г`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl bg-bg/80 py-2 text-center"
                      >
                        <div className="text-[10px] text-muted">{label}</div>
                        <div className="text-xs font-semibold tabular-nums">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-2xl border px-4 py-3 transition-colors text-left",
                      paymentMethod === "card"
                        ? "border-orange/40 bg-orange/10"
                        : "border-border bg-surface-el hover:bg-surface-ov",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard
                        size={14}
                        className={
                          paymentMethod === "card"
                            ? "text-orange"
                            : "text-muted"
                        }
                      />
                      <span className="text-xs text-muted font-medium">
                        Картой
                      </span>
                    </div>
                    <span className="text-base font-bold tabular-nums text-foreground leading-none">
                      {formatPrice(totalRub, currencySymbol)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("beans")}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-2xl border px-4 py-3 transition-colors text-left",
                      paymentMethod === "beans"
                        ? "border-orange/40 bg-orange/10"
                        : "border-border bg-surface-el hover:bg-surface-ov",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <CoffeeBeanIcon
                        size={14}
                        className={
                          paymentMethod === "beans"
                            ? "text-orange"
                            : "text-muted"
                        }
                      />
                      <span className="text-xs text-muted font-medium">
                        Бинами
                      </span>
                    </div>
                    <BeanAmount
                      beans={totalBeans}
                      iconSize={16}
                      className="text-base font-bold leading-none"
                    />
                  </button>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  loading={confirming}
                  disabled={!paymentMethod}
                  onClick={() =>
                    paymentMethod &&
                    onConfirm({
                      totalRub,
                      totalBeans,
                      labels,
                      paymentMethod,
                      temperatureId: singleSel["temperature"] ?? "t-hot",
                      milkId: singleSel["milk"] ?? "m-regular",
                      singleSel,
                      multiSel: Array.from(multiSel),
                    })
                  }
                >
                  {confirming ? "Оформляем…" : "Купить"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

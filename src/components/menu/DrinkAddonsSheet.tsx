'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import {
  DRINK_ADDON_GROUPS,
  type DrinkAddonGroup,
} from '@/lib/mock-data/drink-addons';
import Button from '@/components/ui/Button';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

function BeanAmount({
  beans,
  iconSize = 11,
  className,
  positivePrefix = false,
}: {
  beans: number;
  iconSize?: number;
  className?: string;
  /** префикс «+» только для допов; для итого — просто число */
  positivePrefix?: boolean;
}) {
  const text =
    positivePrefix && beans > 0 ? `+${beans}` : `${beans}`;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 tabular-nums text-amber-400/90',
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
    if (g.type !== 'single') continue;
    const free = g.options.find((o) => o.priceRub === 0 && o.priceBeans === 0);
    m[g.id] = (free ?? g.options[0]).id;
  }
  return m;
}

function defaultMultiSelection(): Set<string> {
  const s = new Set<string>();
  for (const g of DRINK_ADDON_GROUPS) {
    if (g.type !== 'multi') continue;
    for (const o of g.options) {
      if (o.priceRub === 0 && o.priceBeans === 0) s.add(o.id);
    }
  }
  return s;
}

function optionById(group: DrinkAddonGroup, id: string) {
  return group.options.find((o) => o.id === id);
}

interface Props {
  open: boolean;
  onClose: () => void;
  drinkName: string;
  volumeLabel: string;
  basePriceRub: number;
  baseBeans: number;
  currencySymbol: string;
  onConfirm: (payload: {
    totalRub: number;
    totalBeans: number;
    labels: string[];
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
  onConfirm,
  confirming,
  bought,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [singleSel, setSingleSel] = useState<Record<string, string>>(defaultSingleSelection);
  const [multiSel, setMultiSel] = useState<Set<string>>(defaultMultiSelection);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setSingleSel(defaultSingleSelection());
    setMultiSel(defaultMultiSelection());
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const { addonRub, addonBeans, labels } = useMemo(() => {
    let ar = 0;
    let ab = 0;
    const ls: string[] = [];
    for (const g of DRINK_ADDON_GROUPS) {
      if (g.type === 'single') {
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
              'relative z-10 flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col overflow-hidden bg-surface shadow-2xl lg:mx-auto lg:max-h-[85vh] lg:rounded-3xl',
              'rounded-t-3xl border border-border border-b-0 lg:border-b',
            )}
            initial={{ y: '100%', opacity: 0.96 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.96 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 360,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 id="addons-sheet-title" className="text-lg font-semibold leading-tight">
                  Допы к заказу
                </h2>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {drinkName} · {volumeLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !confirming && !bought && onClose()}
                className="flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-surface-el"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {bought ? (
                <motion.div
                  className="flex flex-col items-center gap-4 py-10"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                    <Check size={32} className="text-success" />
                  </div>
                  <p className="text-lg font-semibold">Куплено!</p>
                  <p className="text-center text-sm text-muted">Купон добавлен в раздел «Купоны»</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {DRINK_ADDON_GROUPS.map((group, gi) => (
                    <motion.section
                      key={group.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * gi, duration: 0.28, ease: 'easeOut' }}
                    >
                      <h3 className="mb-3 text-sm font-semibold text-muted">{group.title}</h3>
                      <div className="space-y-2">
                        {group.options.map((opt) => {
                          const isSingle = group.type === 'single';
                          const checked = isSingle
                            ? singleSel[group.id] === opt.id
                            : multiSel.has(opt.id);

                          return (
                            <label
                              key={opt.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                                checked
                                  ? 'border-orange/40 bg-orange/10'
                                  : 'border-border bg-surface-el hover:border-border hover:bg-surface-ov',
                              )}
                            >
                              <input
                                type={isSingle ? 'radio' : 'checkbox'}
                                name={isSingle ? `addon-${group.id}` : undefined}
                                checked={checked}
                                onChange={() => {
                                  if (isSingle) {
                                    setSingleSel((s) => ({ ...s, [group.id]: opt.id }));
                                  } else {
                                    toggleMultiOption(opt.id);
                                  }
                                }}
                                className="h-4 w-4 shrink-0 rounded border-border accent-orange"
                              />
                              <span className="min-w-0 flex-1 text-sm font-medium">{opt.name}</span>
                              <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                                <span className="font-semibold tabular-nums text-white">
                                  {opt.priceRub === 0
                                    ? `0 ${currencySymbol}`
                                    : `+${opt.priceRub} ${currencySymbol}`}
                                </span>
                                <BeanAmount beans={opt.priceBeans} iconSize={12} positivePrefix />
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </motion.section>
                  ))}

                  <div className="rounded-2xl border border-dashed border-border bg-bg/50 px-4 py-3 text-center text-xs text-muted">
                    Оплата в приложении в разработке — это демо-заказ без списания
                  </div>
                </div>
              )}
            </div>

            {!bought && (
              <div
                className="shrink-0 border-t border-border bg-surface px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
              >
                <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">Итого</span>
                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    <span className="font-semibold text-white">
                      {formatPrice(totalRub, currencySymbol)}
                    </span>
                    <BeanAmount beans={totalBeans} iconSize={15} className="text-sm font-semibold" />
                  </div>
                </div>
                <Button
                  fullWidth
                  size="lg"
                  loading={confirming}
                  onClick={() => onConfirm({ totalRub, totalBeans, labels })}
                >
                  {confirming ? 'Оформляем…' : 'Подтвердить заказ'}
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

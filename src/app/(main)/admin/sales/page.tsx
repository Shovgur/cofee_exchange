"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { postSaleBatch, type ApiSaleBatchItem } from "@/lib/api";
import {
  fetchAdminDrinksList,
  type AdminDrinkRead,
} from "@/lib/api/admin-drinks";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { AdminMobileBackLink } from "@/components/admin/AdminMobileBackLink";

/** Три объёма (как size_id для API). */
const SIZE_OPTIONS: { size_id: string; label: string }[] = [
  { size_id: "0.2", label: "0,2 л" },
  { size_id: "0.4", label: "0,4 л" },
  { size_id: "0.6", label: "0,6 л" },
];

function normName(name: string): string {
  return name.trim().toLowerCase();
}

function findVariantForSize(
  rows: AdminDrinkRead[],
  size_id: string,
): AdminDrinkRead | undefined {
  const target = parseFloat(size_id);
  if (!Number.isFinite(target)) return undefined;
  return rows.find((v) => {
    if (v.unitCapacity == null || Number.isNaN(v.unitCapacity)) return false;
    return Math.abs(v.unitCapacity - target) < 0.021;
  });
}

function makePosItemId(variant: AdminDrinkRead, index: number): string {
  const base =
    variant.pos_item_id?.trim() ||
    `ce-${variant.drink_id.slice(0, 8)}`;
  return `${base}-test-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

type DrinkGroup = { key: string; displayName: string; variants: AdminDrinkRead[] };

type Row = {
  drinkKey: string;
  size_id: string;
  quantity: string;
};

function defaultRow(groups: DrinkGroup[]): Row {
  const g = groups[0];
  return {
    drinkKey: g?.key ?? "",
    size_id: "0.4",
    quantity: "1",
  };
}

export default function AdminSalesTestPage() {
  const [catalog, setCatalog] = useState<AdminDrinkRead[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [soldAt, setSoldAt] = useState(() => new Date().toISOString());
  const [soldAtNull, setSoldAtNull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const list = await fetchAdminDrinksList(500);
      setCatalog(list);
    } catch (e) {
      setCatalogError(
        e instanceof Error ? e.message : "Не удалось загрузить напитки",
      );
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const groups = useMemo((): DrinkGroup[] => {
    const m = new Map<string, AdminDrinkRead[]>();
    for (const d of catalog) {
      const k = normName(d.name);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(d);
    }
    const out: DrinkGroup[] = [];
    m.forEach((variants, key) => {
      variants.sort(
        (a: AdminDrinkRead, b: AdminDrinkRead) =>
          (a.unitCapacity ?? 0) - (b.unitCapacity ?? 0),
      );
      const displayName = variants[0]?.name.trim() ?? key;
      out.push({ key, displayName, variants });
    });
    out.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "ru", {
        sensitivity: "base",
      }),
    );
    return out;
  }, [catalog]);

  useEffect(() => {
    if (groups.length === 0) return;
    setRows((prev) => {
      if (prev.length > 0) return prev;
      return [defaultRow(groups)];
    });
  }, [groups]);

  const groupByKey = useMemo(() => {
    const map = new Map<string, DrinkGroup>();
    for (const g of groups) map.set(g.key, g);
    return map;
  }, [groups]);

  const patchRow = useCallback((index: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      defaultRow(groups.length ? groups : []),
    ]);
  }, [groups]);

  const removeRow = useCallback((index: number) => {
    setRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }, []);

  async function handleSubmit() {
    setError(null);
    setOk(false);

    const items: ApiSaleBatchItem[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const g = groupByKey.get(r.drinkKey);
      if (!g) {
        setError(`Строка ${i + 1}: выберите напиток из списка`);
        return;
      }
      const variant = findVariantForSize(g.variants, r.size_id);
      if (!variant) {
        setError(
          `Строка ${i + 1}: для «${g.displayName}» нет объёма ${r.size_id.replace(".", ",")} л в каталоге — выберите другой объём`,
        );
        return;
      }
      const q = Number(r.quantity);
      if (!Number.isFinite(q) || q < 1) {
        setError(`Строка ${i + 1}: укажите количество (целое число от 1)`);
        return;
      }
      items.push({
        pos_item_id: makePosItemId(variant, i),
        size_id: r.size_id,
        drink_id: variant.drink_id,
        quantity: Math.floor(q),
      });
    }

    if (items.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      return;
    }

    const payload = {
      items,
      sold_at: soldAtNull ? null : soldAt.trim() || null,
      source: "pos_plugin",
    };

    setLoading(true);
    try {
      await postSaleBatch(payload);
      setOk(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full pb-8 sm:pb-12">
      <AdminMobileBackLink />
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-3 pt-3 pb-3 backdrop-blur-md sm:px-4 lg:px-8 lg:pt-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange/15 flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-orange" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                Тестовые продажи
              </h1>
              <p className="text-xs text-muted mt-0.5 truncate">
                Регистрация продаж для проверки биржи
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadCatalog}
            disabled={catalogLoading}
            className="p-2 rounded-xl hover:bg-surface-el text-muted hover:text-white transition-colors disabled:opacity-40 shrink-0"
            title="Обновить список напитков"
          >
            <RefreshCw
              size={16}
              className={cn(catalogLoading && "animate-spin")}
            />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-3xl space-y-5 px-3 sm:mt-6 sm:space-y-6 sm:px-4 lg:px-8">
        {catalogError && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{catalogError}</p>
          </div>
        )}

        {catalogLoading && !catalog.length && !catalogError && (
          <div className="text-sm text-muted">Загрузка списка напитков…</div>
        )}

        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {ok && (
          <div className="flex items-center gap-2 text-success text-sm bg-success/10 border border-success/25 rounded-2xl px-4 py-3">
            <CheckCircle size={18} />
            Готово — продажи отправлены
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-border bg-surface sm:rounded-2xl">
          <div className="border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
            <span className="text-sm font-semibold">Позиции в чеке</span>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {groups.length === 0 && !catalogLoading && !catalogError && (
              <p className="text-sm text-muted">
                Список напитков пуст — сначала добавьте напитки в разделе «Напитки».
              </p>
            )}

            {rows.map((row, index) => {
              const g = groupByKey.get(row.drinkKey);
              const missingVolume =
                g != null &&
                findVariantForSize(g.variants, row.size_id) === undefined;

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface-el/50 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4"
                >
                  <label className="block text-sm text-white sm:col-span-2">
                    <span className="text-muted">Напиток</span>
                    <select
                      value={row.drinkKey}
                      onChange={(e) =>
                        patchRow(index, { drinkKey: e.target.value })
                      }
                      disabled={groups.length === 0}
                      className="form-select mt-1.5"
                    >
                      {groups.map((gr) => (
                        <option key={gr.key} value={gr.key}>
                          {gr.displayName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-white">
                    <span className="text-muted">Объём</span>
                    <select
                      value={row.size_id}
                      onChange={(e) =>
                        patchRow(index, { size_id: e.target.value })
                      }
                      className="form-select mt-1.5"
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s.size_id} value={s.size_id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-white">
                    <span className="text-muted">Количество</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.quantity}
                      onChange={(e) =>
                        patchRow(index, { quantity: e.target.value })
                      }
                      className="form-input mt-1.5 [appearance:textfield]"
                    />
                  </label>

                  {missingVolume && (
                    <p className="sm:col-span-2 text-xs text-danger">
                      Такого объёма нет в каталоге для выбранного напитка —
                      выберите другой.
                    </p>
                  )}

                  <div className="flex items-end justify-end sm:justify-start sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length <= 1}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted",
                        "hover:bg-danger/10 hover:text-danger transition-colors",
                        "disabled:opacity-30 disabled:pointer-events-none",
                      )}
                    >
                      <Trash2 size={16} />
                      Удалить строку
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addRow}
              disabled={groups.length === 0}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm text-orange hover:underline disabled:opacity-40 sm:min-h-0"
            >
              <Plus size={16} />
              Добавить строку
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface sm:rounded-2xl">
          <div className="border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
            <span className="text-sm font-semibold">Дополнительно</span>
          </div>
          <div className="space-y-4 px-4 py-4 sm:px-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={soldAtNull}
                onChange={(e) => setSoldAtNull(e.target.checked)}
                className="mt-0.5 size-[1.125rem] shrink-0 rounded border-border accent-orange"
              />
              <span className="text-sm text-muted">
                Не указывать время продажи — пусть подставит сервер
              </span>
            </label>

            {!soldAtNull && (
              <label className="block text-sm text-white">
                <span className="text-muted">Время продажи</span>
                <input
                  value={soldAt}
                  onChange={(e) => setSoldAt(e.target.value)}
                  placeholder="Дата и время в формате ISO"
                  className={cn(
                    "form-input mt-1.5 !bg-surface-el font-mono text-xs sm:text-sm",
                  )}
                />
              </label>
            )}
          </div>
        </section>

        <div className="flex w-full justify-center pt-1">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={groups.length === 0 || catalogLoading}
            fullWidth
            size="md"
            className={cn(
              "!h-12 w-full max-w-full justify-center rounded-2xl px-6 text-[15px] !leading-none sm:max-w-md",
            )}
          >
            Отправить продажи
          </Button>
        </div>
      </div>
    </div>
  );
}

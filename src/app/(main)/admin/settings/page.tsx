"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Settings,
  History,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ScrollText,
} from "lucide-react";
import {
  fetchAdminSettings,
  fetchAdminSettingsHistory,
  postAdminRecalc,
  putAdminSettings,
  type ApiAdminRecalcResponse,
  type ApiAdminSettings,
  type ApiAdminSettingsHistoryItem,
  type ApiAdminSettingsUpdate,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { AdminMobileBackLink } from "@/components/admin/AdminMobileBackLink";

//  Helpers

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function settingsToForm(s: ApiAdminSettings): FormState {
  return {
    price_update_interval_sec: String(s.price_update_interval_sec),
    sales_analysis_window_sec: String(s.sales_analysis_window_sec),
    neutral_zone_percent: s.neutral_zone_percent,
    max_step_up_pct: s.max_step_up_pct,
    max_step_down_pct: s.max_step_down_pct,
    max_step_to_center_pct: s.max_step_to_center_pct,
    default_sensitivity: s.default_sensitivity,
    default_min_pct: s.default_min_pct,
    default_max_pct: s.default_max_pct,
    price_rounding_step: s.price_rounding_step,
    fixed_items_affect_market: s.fixed_items_affect_market,
  };
}

function formToPayload(f: FormState): ApiAdminSettingsUpdate {
  return {
    price_update_interval_sec: Number(f.price_update_interval_sec) || 0,
    sales_analysis_window_sec: Number(f.sales_analysis_window_sec) || 0,
    neutral_zone_percent: parseFloat(f.neutral_zone_percent) || 0,
    max_step_up_pct: parseFloat(f.max_step_up_pct) || 0,
    max_step_down_pct: parseFloat(f.max_step_down_pct) || 0,
    max_step_to_center_pct: parseFloat(f.max_step_to_center_pct) || 0,
    default_sensitivity: parseFloat(f.default_sensitivity) || 0,
    default_min_pct: parseFloat(f.default_min_pct) || 0,
    default_max_pct: parseFloat(f.default_max_pct) || 0,
    price_rounding_step: parseFloat(f.price_rounding_step) || 0,
    fixed_items_affect_market: f.fixed_items_affect_market,
  };
}

//  Types

interface FormState {
  price_update_interval_sec: string;
  sales_analysis_window_sec: string;
  neutral_zone_percent: string;
  max_step_up_pct: string;
  max_step_down_pct: string;
  max_step_to_center_pct: string;
  default_sensitivity: string;
  default_min_pct: string;
  default_max_pct: string;
  price_rounding_step: string;
  fixed_items_affect_market: boolean;
}

//  Sub-components

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-1.5 sm:gap-4 items-start py-3 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {hint && (
          <div className="text-[11px] text-muted mt-0.5 leading-snug">
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <input
      type="number"
      step="any"
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      onChange={
        readOnly || disabled ? undefined : (e) => onChange?.(e.target.value)
      }
      className={cn(
        "w-full bg-surface-el border border-border rounded-xl px-3 py-2 text-sm text-white",
        "focus:outline-none focus:border-orange/60 transition-colors",
        (disabled || readOnly) && "opacity-60 cursor-not-allowed",
      )}
    />
  );
}

function MarketAvgBand({ data }: { data: ApiAdminRecalcResponse }) {
  const low = parseFloat(data.neutral_band_low);
  const high = parseFloat(data.neutral_band_high);
  const avg = parseFloat(data.market_avg);
  const span = high - low;
  const valid =
    Number.isFinite(low) &&
    Number.isFinite(high) &&
    Number.isFinite(avg) &&
    Number.isFinite(span) &&
    span > 0;

  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-muted">
        Пересчитано позиций:{" "}
        <span className="font-mono text-white">{data.recalculated}</span>
      </p>
      <div>
        <p className="text-[11px] text-muted mb-1.5">
          Нейтральная полоса и средний «рынок»
        </p>
        {valid ? (
          <div className="space-y-1">
            <div className="relative h-7 rounded-xl bg-surface-el border border-border overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-orange/5 via-orange/15 to-orange/5"
                title="Нейтральный коридор"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-orange shadow-[0_0_10px_rgba(255,140,0,0.45)]"
                style={{
                  left: `${Math.min(100, Math.max(0, ((avg - low) / span) * 100))}%`,
                }}
                title={`Среднее по рынку: ${data.market_avg}`}
              />
            </div>
            <div className="flex justify-between gap-2 text-[10px] font-mono text-muted">
              <span title="Нижняя граница нейтральной зоны">
                {data.neutral_band_low}
              </span>
              <span className="text-orange shrink-0" title="Среднее по рынку">
                {data.market_avg}
              </span>
              <span title="Верхняя граница нейтральной зоны">
                {data.neutral_band_high}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono text-muted space-y-0.5 rounded-xl border border-border bg-surface-el px-3 py-2">
            <div>рынок: {data.market_avg}</div>
            <div>
              полоса: {data.neutral_band_low} … {data.neutral_band_high}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

//  Page

export default function AdminPage() {
  const [history, setHistory] = useState<ApiAdminSettingsHistoryItem[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "err">("idle");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcOutput, setRecalcOutput] = useState<
    | { ok: true; data: ApiAdminRecalcResponse }
    | { ok: false; text: string }
    | null
  >(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([
        fetchAdminSettings(),
        fetchAdminSettingsHistory(),
      ]);
      setForm(settingsToForm(s));
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [loadAll]);

  function patch(key: keyof FormState, value: string | boolean) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await putAdminSettings(formToPayload(form));
      setForm(settingsToForm(updated));
      setSaveStatus("ok");
      const [h] = await Promise.all([fetchAdminSettingsHistory()]);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
      setSaveStatus("err");
    } finally {
      setSaving(false);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleRecalc() {
    setRecalcLoading(true);
    setRecalcOutput(null);
    try {
      const data = await postAdminRecalc();
      setRecalcOutput({ ok: true, data });
    } catch (e) {
      setRecalcOutput({
        ok: false,
        text: e instanceof Error ? e.message : "Ошибка пересчёта",
      });
    } finally {
      setRecalcLoading(false);
    }
  }

  return (
    <div className="min-h-full pb-12">
      <AdminMobileBackLink />
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-3 pt-3 backdrop-blur-md sm:px-4 lg:px-8 lg:pt-8 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange/15 flex items-center justify-center shrink-0">
              <Settings size={18} className="text-orange" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                Администрирование
              </h1>
              <p className="text-xs text-muted mt-0.5">Настройки движка цен</p>
            </div>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-surface-el text-muted hover:text-white transition-colors disabled:opacity-40"
            title="Перезагрузить"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-3xl space-y-6 px-3 sm:px-4 lg:px-8">
        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Skeleton */}
        {loading && !form && (
          <div className="bg-surface rounded-2xl p-4 space-y-4 animate-pulse">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-el rounded-xl" />
            ))}
          </div>
        )}

        {/* Settings form */}
        {form && (
          <section className="bg-surface rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Settings size={15} className="text-orange" />
              <span className="text-sm font-semibold">Текущие настройки</span>
            </div>

            <div className="px-5">
              <p className="text-[11px] text-muted uppercase tracking-wider pt-3 pb-2">
                Редактирование
              </p>

              <FieldRow
                label="Интервал обновления цен, сек"
                hint="Как часто на сервере пересчитываются и обновляются цены"
              >
                <NumInput
                  value={form.price_update_interval_sec}
                  onChange={(v) => patch("price_update_interval_sec", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Окно анализа продаж"
                hint="За сколько секунд назад учитываются продажи при расчёте цены"
              >
                <NumInput
                  value={form.sales_analysis_window_sec}
                  onChange={(v) => patch("sales_analysis_window_sec", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Нейтральная зона, %"
                hint="Доля напитков в нейтральной зоне (без сильного сдвига цены к верху или низу)"
              >
                <NumInput
                  value={form.neutral_zone_percent}
                  onChange={(v) => patch("neutral_zone_percent", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Макс. шаг вверх (%)"
                hint="Максимальное разовое повышение цены"
              >
                <NumInput
                  value={form.max_step_up_pct}
                  onChange={(v) => patch("max_step_up_pct", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Макс. шаг вниз (%)"
                hint="Максимальное разовое снижение цены"
              >
                <NumInput
                  value={form.max_step_down_pct}
                  onChange={(v) => patch("max_step_down_pct", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Макс. шаг к центру (%)"
                hint="С какой силой цена притягивается обратно к базовой"
              >
                <NumInput
                  value={form.max_step_to_center_pct}
                  onChange={(v) => patch("max_step_to_center_pct", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Чувствительность по умолчанию"
                hint="Насколько быстро цена реагирует на всплески продаж"
              >
                <NumInput
                  value={form.default_sensitivity}
                  onChange={(v) => patch("default_sensitivity", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Мин. отклонение от базы (%)"
                hint="Нижняя граница изменения цены для новых позиций"
              >
                <NumInput
                  value={form.default_min_pct}
                  onChange={(v) => patch("default_min_pct", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Макс. отклонение от базы (%)"
                hint="Верхняя граница изменения цены для новых позиций"
              >
                <NumInput
                  value={form.default_max_pct}
                  onChange={(v) => patch("default_max_pct", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Шаг округления цены"
                hint="До какого значения округляется итоговая цена (например 5)"
              >
                <NumInput
                  value={form.price_rounding_step}
                  onChange={(v) => patch("price_rounding_step", v)}
                  disabled={saving}
                />
              </FieldRow>

              <FieldRow
                label="Фикс. позиции влияют на рынок"
                hint="Если включено, продажи позиций с фиксированной ценой влияют на расчёт"
              >
                <div className="flex items-center gap-4 min-h-9">
                  <button
                    type="button"
                    disabled={saving}
                    aria-pressed={form.fixed_items_affect_market}
                    onClick={() =>
                      patch(
                        "fixed_items_affect_market",
                        !form.fixed_items_affect_market,
                      )
                    }
                    className={cn(
                      "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50",
                      form.fixed_items_affect_market
                        ? "bg-orange"
                        : "bg-surface-el border border-border",
                      saving && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                        form.fixed_items_affect_market
                          ? "translate-x-[1.375rem]"
                          : "translate-x-0",
                      )}
                    />
                  </button>
                  <span className="text-sm text-muted whitespace-nowrap pl-0.5">
                    {form.fixed_items_affect_market ? "Включено" : "Выключено"}
                  </span>
                </div>
              </FieldRow>
            </div>

            {/* Save bar */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>

              {saveStatus === "ok" && (
                <div className="flex items-center gap-1.5 text-success text-sm">
                  <CheckCircle size={15} />
                  Сохранено
                </div>
              )}
              {saveStatus === "err" && (
                <div className="flex items-center gap-1.5 text-danger text-sm">
                  <AlertCircle size={15} />
                  Ошибка
                </div>
              )}
            </div>
          </section>
        )}

        {/* Принудительный пересчёт */}
        <section className="bg-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ScrollText size={15} className="text-orange shrink-0" />
            <span className="text-sm font-semibold">Логи</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-[11px] text-muted leading-snug">
              Принудительный пересчёт цен вне расписания (обычно обновление идёт
              по интервалу из настроек выше).
            </p>
            <Button
              onClick={handleRecalc}
              disabled={loading}
              loading={recalcLoading}
            >
              Пересчитать цены сейчас
            </Button>
            {recalcOutput &&
              (recalcOutput.ok ? (
                <div className="rounded-xl border border-border bg-surface-el px-3 py-2.5">
                  <MarketAvgBand data={recalcOutput.data} />
                </div>
              ) : (
                <pre className="text-xs font-mono rounded-xl px-3 py-2.5 whitespace-pre-wrap break-words border bg-danger/10 border-danger/30 text-danger">
                  {recalcOutput.text}
                </pre>
              ))}
          </div>
        </section>

        {/* History */}
        <section className="bg-surface rounded-2xl overflow-hidden">
          <button
            className="w-full px-5 py-4 flex items-center gap-2 hover:bg-surface-el transition-colors"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            <History size={15} className="text-orange shrink-0" />
            <span className="text-sm font-semibold">История версий</span>
            <span className="ml-2 text-[11px] text-muted">
              {history.length} записей
            </span>
            <span className="ml-auto text-muted">
              {historyOpen ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </span>
          </button>

          {historyOpen && (
            <div className="border-t border-border">
              {history.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted">История пуста</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-el">
                      <th className="px-5 py-2.5 text-left text-[11px] font-medium text-muted uppercase tracking-wider">
                        Версия
                      </th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-medium text-muted uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-5 py-2.5 text-left text-[11px] font-medium text-muted uppercase tracking-wider">
                        Дата создания
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, i) => (
                      <tr
                        key={item.id}
                        className={cn(
                          "border-b border-border last:border-0 transition-colors",
                          i % 2 === 0 ? "" : "bg-surface-el/30",
                        )}
                      >
                        <td className="px-5 py-3 font-mono font-bold text-orange">
                          v{item.version}
                        </td>
                        <td className="px-5 py-3 text-muted text-xs font-mono">
                          {item.id}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {fmt(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Zap,
  Activity,
} from "lucide-react";
import {
  fetchAdminDrink,
  putAdminDrinkProfile,
  putAdminDrinkBasePrice,
  postAdminDrinkFix,
  postAdminDrinkUnfix,
  postAdminDrinkManualSet,
  postAdminDrinkToggleActive,
  type AdminDrinkRead,
} from "@/lib/api/admin-drinks";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { AdminMobileBackLink } from "@/components/admin/AdminMobileBackLink";

// Helpers

function fmt(iso: string | null) {
  if (!iso) return "—";
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

function pctColor(pct: string) {
  const v = parseFloat(pct);
  if (v > 0) return "text-success";
  if (v < 0) return "text-danger";
  return "text-muted";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-1.5 sm:gap-4 items-start py-3 border-b border-border last:border-0">
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

function Inp({
  value,
  onChange,
  disabled,
  placeholder,
  readOnly,
  type = "text",
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      step="any"
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
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

function StatusBadge({
  ok,
  children,
}: {
  ok: "ok" | "err" | "idle";
  children?: React.ReactNode;
}) {
  if (ok === "ok")
    return (
      <span className="flex items-center gap-1.5 text-success text-sm">
        <CheckCircle size={14} /> {children ?? "Сохранено"}
      </span>
    );
  if (ok === "err")
    return (
      <span className="flex items-center gap-1.5 text-danger text-sm">
        <AlertCircle size={14} /> Ошибка
      </span>
    );
  return null;
}

// Page

interface PageProps {
  params: { drinkId: string };
}

export default function AdminDrinkDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { drinkId } = params;

  const [drink, setDrink] = useState<AdminDrinkRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    sensitivity: "",
    min_pct: "",
    max_pct: "",
    max_step_up_pct_override: "",
    max_step_down_pct_override: "",
    max_step_to_center_pct_override: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<"idle" | "ok" | "err">(
    "idle",
  );

  // Base price
  const [basePrice, setBasePrice] = useState("");
  const [bpSaving, setBpSaving] = useState(false);
  const [bpStatus, setBpStatus] = useState<"idle" | "ok" | "err">("idle");

  // Fix
  const [fixPct, setFixPct] = useState("");
  const [fixSaving, setFixSaving] = useState(false);
  const [fixStatus, setFixStatus] = useState<"idle" | "ok" | "err">("idle");

  // Manual set
  const [manualPct, setManualPct] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualStatus, setManualStatus] = useState<"idle" | "ok" | "err">(
    "idle",
  );

  // Toggle
  const [toggling, setToggling] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  function autoReset(set: (s: "idle" | "ok" | "err") => void) {
    const t = setTimeout(() => set("idle"), 3000);
    timersRef.current.push(t);
  }

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    [],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const d = await fetchAdminDrink(drinkId);
        setDrink(d);
        setProfileForm({
          name: d.name,
          sensitivity: d.sensitivity,
          min_pct: d.min_pct,
          max_pct: d.max_pct,
          max_step_up_pct_override: d.max_step_up_pct_override ?? "",
          max_step_down_pct_override: d.max_step_down_pct_override ?? "",
          max_step_to_center_pct_override:
            d.max_step_to_center_pct_override ?? "",
        });
        setBasePrice(d.defaultSalePrice);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [drinkId],
  );

  useEffect(() => {
    load();
  }, [load]);

  function patchProfile(key: keyof typeof profileForm, v: string) {
    setProfileForm((prev) => ({ ...prev, [key]: v }));
  }

  async function saveProfile() {
    if (!drink) return;
    setProfileSaving(true);
    try {
      const d = await putAdminDrinkProfile(drinkId, {
        name: profileForm.name.trim() || null,
        min_pct: profileForm.min_pct || null,
        max_pct: profileForm.max_pct || null,
        max_step_up_pct_override: profileForm.max_step_up_pct_override || null,
        max_step_down_pct_override:
          profileForm.max_step_down_pct_override || null,
        max_step_to_center_pct_override:
          profileForm.max_step_to_center_pct_override || null,
      });
      setDrink(d);
      setProfileStatus("ok");
    } catch {
      setProfileStatus("err");
    } finally {
      setProfileSaving(false);
      autoReset(setProfileStatus);
    }
  }

  async function saveBasePrice() {
    if (!basePrice.trim()) return;
    setBpSaving(true);
    try {
      const d = await putAdminDrinkBasePrice(drinkId, {
        defaultSalePrice: parseFloat(basePrice) || 0,
      });
      setDrink(d);
      setBasePrice(d.defaultSalePrice);
      setBpStatus("ok");
    } catch {
      setBpStatus("err");
    } finally {
      setBpSaving(false);
      autoReset(setBpStatus);
    }
  }

  async function saveFix() {
    if (!fixPct.trim()) return;
    setFixSaving(true);
    try {
      const d = await postAdminDrinkFix(drinkId, {
        fixed_pct: parseFloat(fixPct) || 0,
      });
      setDrink(d);
      setFixStatus("ok");
    } catch {
      setFixStatus("err");
    } finally {
      setFixSaving(false);
      autoReset(setFixStatus);
    }
  }

  async function handleUnfix() {
    setFixSaving(true);
    try {
      const d = await postAdminDrinkUnfix(drinkId);
      setDrink(d);
      setFixPct("");
      setFixStatus("ok");
    } catch {
      setFixStatus("err");
    } finally {
      setFixSaving(false);
      autoReset(setFixStatus);
    }
  }

  async function saveManual() {
    if (!manualPct.trim()) return;
    setManualSaving(true);
    try {
      const d = await postAdminDrinkManualSet(drinkId, {
        pct: parseFloat(manualPct) || 0,
      });
      setDrink(d);
      setManualPct("");
      setManualStatus("ok");
    } catch {
      setManualStatus("err");
    } finally {
      setManualSaving(false);
      autoReset(setManualStatus);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const d = await postAdminDrinkToggleActive(drinkId);
      setDrink(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setToggling(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-full pb-12">
        <AdminMobileBackLink />
        <div className="mx-auto max-w-2xl space-y-4 px-3 pt-4 sm:px-4 lg:px-8 lg:pt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="min-h-full pb-12">
      <AdminMobileBackLink />
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg/95 px-3 pt-3 backdrop-blur-md sm:px-4 lg:px-8 lg:pt-8 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{drink?.name ?? "…"}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {drink && (
                <>
                  <span
                    className={cn(
                      "text-xs font-mono font-medium",
                      pctColor(drink.current_pct),
                    )}
                  >
                    {parseFloat(drink.current_price).toFixed(0)} ₽ &nbsp;(
                    {parseFloat(drink.current_pct) > 0 ? "+" : ""}
                    {parseFloat(drink.current_pct).toFixed(2)}%)
                  </span>
                  {drink.is_fixed && (
                    <span className="text-[11px] bg-orange/15 text-orange px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Lock size={9} /> Фиксация{" "}
                      {drink.fixed_pct ? `${drink.fixed_pct}%` : ""}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-lg",
                      drink.is_active
                        ? "bg-success/15 text-success"
                        : "bg-surface-el text-muted",
                    )}
                  >
                    {drink.is_active ? "Активен" : "Неактивен"}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => load(true)}
            className="p-2 rounded-xl hover:bg-surface-el text-muted hover:text-white transition-colors"
            title="Обновить"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-2xl space-y-5 px-3 sm:px-4 lg:px-8">
        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* ── Информация (read-only) ── */}
        {drink && (
          <Section title="Информация">
            <Row label="Объём">
              <Inp
                value={
                  drink.unitCapacity != null ? `${drink.unitCapacity} л` : "—"
                }
                readOnly
              />
            </Row>
            <Row
              label="Последние продажи"
              hint="Фактические / эффективные (с учётом веса)"
            >
              <div className="flex gap-2">
                <Inp value={String(drink.last_actual_sales)} readOnly />
                <Inp value={drink.last_effective_sales} readOnly />
              </div>
            </Row>
            <Row label="Обновлено">
              <Inp value={fmt(drink.updated_at)} readOnly />
            </Row>
          </Section>
        )}

        {/* ── Профиль ── */}
        <Section title="Профиль напитка">
          <Row label="Название">
            <Inp
              value={profileForm.name}
              onChange={(v) => patchProfile("name", v)}
              disabled={profileSaving}
              placeholder={drink?.name}
            />
          </Row>
          <Row
            label="Чувствительность"
            hint="Пока отключено — используется «Чувствительность по умолчанию» в общих настройках"
          >
            <Inp
              type="number"
              value={profileForm.sensitivity}
              onChange={(v) => patchProfile("sensitivity", v)}
              disabled
              placeholder="авто"
            />
          </Row>
          <Row label="Мин. отклонение (%)">
            <Inp
              type="number"
              value={profileForm.min_pct}
              onChange={(v) => patchProfile("min_pct", v)}
              disabled={profileSaving}
              placeholder="авто"
            />
          </Row>
          <Row label="Макс. отклонение (%)">
            <Inp
              type="number"
              value={profileForm.max_pct}
              onChange={(v) => patchProfile("max_pct", v)}
              disabled={profileSaving}
              placeholder="авто"
            />
          </Row>
          <Row label="Макс. шаг вверх (override)" hint="Пусто = из глобальных">
            <Inp
              type="number"
              value={profileForm.max_step_up_pct_override}
              onChange={(v) => patchProfile("max_step_up_pct_override", v)}
              disabled={profileSaving}
              placeholder="авто"
            />
          </Row>
          <Row label="Макс. шаг вниз (override)">
            <Inp
              type="number"
              value={profileForm.max_step_down_pct_override}
              onChange={(v) => patchProfile("max_step_down_pct_override", v)}
              disabled={profileSaving}
              placeholder="авто"
            />
          </Row>
          <Row label="Шаг к центру (override)">
            <Inp
              type="number"
              value={profileForm.max_step_to_center_pct_override}
              onChange={(v) =>
                patchProfile("max_step_to_center_pct_override", v)
              }
              disabled={profileSaving}
              placeholder="авто"
            />
          </Row>
          <div className="flex items-center gap-3 py-4">
            <Button onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Сохранить профиль
            </Button>
            <StatusBadge ok={profileStatus} />
          </div>
        </Section>

        {/* ── Базовая цена ── */}
        <Section title="Базовая цена">
          <div className="py-3">
            <Inp
              type="number"
              value={basePrice}
              onChange={(v) => setBasePrice(v)}
              disabled={bpSaving}
              placeholder="0"
            />
          </div>
          <div className="flex items-center gap-3 py-4">
            <Button onClick={saveBasePrice} disabled={bpSaving}>
              {bpSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Установить цену
            </Button>
            <StatusBadge ok={bpStatus} />
          </div>
        </Section>

        {/* ── Фиксация цены ── */}
        <Section title="Фиксация цены">
          {drink?.is_fixed ? (
            <Row
              label="Зафиксировано на"
              hint={`fixed_pct = ${drink.fixed_pct ?? "?"}`}
            >
              <Inp value={`${drink.fixed_pct ?? "—"}%`} readOnly />
            </Row>
          ) : (
            <Row label="Зафиксировать на (%)">
              <Inp
                type="number"
                value={fixPct}
                onChange={(v) => setFixPct(v)}
                disabled={fixSaving}
                placeholder="Например: 0 или -5"
              />
            </Row>
          )}
          <div className="flex items-center gap-3 py-4 flex-wrap">
            {!drink?.is_fixed && (
              <Button onClick={saveFix} disabled={fixSaving || !fixPct.trim()}>
                {fixSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                Зафиксировать
              </Button>
            )}
            {drink?.is_fixed && (
              <Button onClick={handleUnfix} disabled={fixSaving}>
                {fixSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Unlock size={14} />
                )}
                Снять фиксацию
              </Button>
            )}
            <StatusBadge ok={fixStatus} />
          </div>
        </Section>

        {/* ── Ручная корректировка ── */}
        <Section title="Ручная корректировка">
          <Row
            label="% отклонения"
            hint="POST /manual-set — разовая установка pct, действует до следующего пересчёта"
          >
            <Inp
              type="number"
              value={manualPct}
              onChange={(v) => setManualPct(v)}
              disabled={manualSaving}
              placeholder="Например: 10 или -7.5"
            />
          </Row>
          {drink?.pending_manual_pct != null && (
            <div className="py-2 text-[11px] text-orange">
              Ожидает применения: {drink.pending_manual_pct}%
            </div>
          )}
          <div className="flex items-center gap-3 py-4">
            <Button
              onClick={saveManual}
              disabled={manualSaving || !manualPct.trim()}
            >
              {manualSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              Применить
            </Button>
            <StatusBadge ok={manualStatus}>Поставлено в очередь</StatusBadge>
          </div>
        </Section>
        {/* ── Участие в рынке ── */}
        <Section title="Участие в рынке">
          <Row
            label={drink?.is_active ? "Напиток активен" : "Напиток неактивен"}
            hint="включает или отключает напиток из биржевого расчёта"
          >
            <div className="flex items-center gap-4 min-h-9">
              <button
                type="button"
                disabled={toggling}
                aria-pressed={drink?.is_active}
                onClick={handleToggle}
                className={cn(
                  "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50",
                  drink?.is_active
                    ? "bg-success"
                    : "bg-surface-el border border-border",
                  toggling && "opacity-50 cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                    drink?.is_active
                      ? "translate-x-[1.375rem]"
                      : "translate-x-0",
                  )}
                />
              </button>
              <span className="text-sm text-muted flex items-center gap-1.5">
                <Activity size={13} />
                {drink?.is_active
                  ? "Участвует в расчёте цен"
                  : "Исключён из расчёта"}
              </span>
            </div>
          </Row>
        </Section>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Save, Loader2, History, FileText, Globe } from 'lucide-react';
import {
  adminGetProgramSettings,
  adminGetProgramSettingsHistory,
  adminPutProgramSettings,
  adminPublishRules,
  type ProgramSettingsOut,
} from '@/lib/api/loyalty/admin';
import { fetchCountries } from '@/lib/api/loyalty/catalog';
import type { ApiCountry } from '@/lib/api/loyalty/types';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function Field({
  label, hint, value, onChange, min = 1,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void; min?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <p className="text-xs text-muted mb-2">{hint}</p>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
      />
    </div>
  );
}

function HistoryRow({ s }: { s: ProgramSettingsOut }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-border/50 last:border-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange text-xs font-bold">
        v{s.version}
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted">Бины за покупку</p>
          <p className="font-medium">{s.beans_accrual_rate} Б/₽</p>
        </div>
        <div>
          <p className="text-xs text-muted">Срок Бинов</p>
          <p className="font-medium">{s.bean_ttl_days} дн.</p>
        </div>
        <div>
          <p className="text-xs text-muted">Срок купона</p>
          <p className="font-medium">{s.coupon_ttl_days} дн.</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-muted">{fmt(s.created_at)}</p>
        {s.created_by && <p className="text-[10px] text-muted truncate max-w-[120px]">{s.created_by}</p>}
      </div>
    </div>
  );
}

interface FormState {
  beans_accrual_rate: string;
  bean_ttl_days: string;
  coupon_ttl_days: string;
}

export default function AdminLoyaltySettingsPage() {
  const [current, setCurrent] = useState<ProgramSettingsOut | null>(null);
  const [history, setHistory] = useState<ProgramSettingsOut[]>([]);
  const [countries, setCountries] = useState<ApiCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, show: showToast } = useToast(3500);

  const [form, setForm] = useState<FormState>({
    beans_accrual_rate: '',
    bean_ttl_days: '',
    coupon_ttl_days: '',
  });

  // Rules publishing
  const [rulesCountry, setRulesCountry] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [rulesSaving, setRulesSaving] = useState(false);

  // Track whether a default country has been set so we only do it once
  const rulesCountrySetRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h, ctrs] = await Promise.all([
        adminGetProgramSettings(),
        adminGetProgramSettingsHistory(),
        fetchCountries(),
      ]);
      setCurrent(s);
      setHistory(h);
      setCountries(ctrs);
      setForm({
        beans_accrual_rate: String(s.beans_accrual_rate),
        bean_ttl_days: String(s.bean_ttl_days),
        coupon_ttl_days: String(s.coupon_ttl_days),
      });
      if (ctrs.length > 0 && !rulesCountrySetRef.current) {
        setRulesCountry(ctrs[0].code);
        rulesCountrySetRef.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePublishRules = async () => {
    if (!rulesCountry || !rulesText.trim()) return;
    setRulesSaving(true);
    try {
      await adminPublishRules({ country_code: rulesCountry, text: rulesText.trim() });
      setRulesText('');
      showToast('Правила опубликованы', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка публикации', false);
    } finally {
      setRulesSaving(false);
    }
  };

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    const beans_accrual_rate = parseInt(form.beans_accrual_rate, 10);
    const bean_ttl_days = parseInt(form.bean_ttl_days, 10);
    const coupon_ttl_days = parseInt(form.coupon_ttl_days, 10);
    if (!beans_accrual_rate || !bean_ttl_days || !coupon_ttl_days) return;

    setSaving(true);
    try {
      const updated = await adminPutProgramSettings({ beans_accrual_rate, bean_ttl_days, coupon_ttl_days });
      setCurrent(updated);
      setHistory((prev) => [updated, ...prev]);
      showToast('Настройки сохранены', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка сохранения', false);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = current
    ? form.beans_accrual_rate !== String(current.beans_accrual_rate)
      || form.bean_ttl_days !== String(current.bean_ttl_days)
      || form.coupon_ttl_days !== String(current.coupon_ttl_days)
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} />

      <div className="p-8 max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-orange" />
            Настройки программы
          </h1>
          {current && (
            <p className="text-sm text-muted">
              Текущая версия: v{current.version}
              {current.created_at && ` · обновлено ${fmt(current.created_at)}`}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
          <Field
            label="Бины за покупку (на ₽)"
            hint="Сколько Бинов начисляется за каждый рубль в чеке"
            value={form.beans_accrual_rate}
            onChange={(v) => setForm((f) => ({ ...f, beans_accrual_rate: v }))}
          />
          <Field
            label="Срок жизни Бинов (дней)"
            hint="Через сколько дней неиспользованные Бины сгорают"
            value={form.bean_ttl_days}
            onChange={(v) => setForm((f) => ({ ...f, bean_ttl_days: v }))}
          />
          <Field
            label="Срок действия купона (дней)"
            hint="Сколько дней активен купон после покупки"
            value={form.coupon_ttl_days}
            onChange={(v) => setForm((f) => ({ ...f, coupon_ttl_days: v }))}
          />

          <Button
            fullWidth
            onClick={handleSave}
            disabled={!isDirty}
            loading={saving}
            className="mt-2"
          >
            {!saving && <Save size={16} />}
            Сохранить настройки
          </Button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted uppercase tracking-wider mb-3">
              <History size={14} />
              История версий
            </h2>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {history.map((s) => (
                <HistoryRow key={s.version} s={s} />
              ))}
            </div>
          </div>
        )}

        {/* Rules publishing */}
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            <FileText size={14} />
            Публикация правил программы
          </h2>
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Страна</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <select
                  value={rulesCountry}
                  onChange={(e) => setRulesCountry(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 appearance-none"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Текст правил</label>
              <p className="text-xs text-muted mb-2">Новая версия заменит текущую для выбранной страны</p>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={8}
                placeholder="Введите текст правил программы лояльности…"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 resize-y"
              />
            </div>
            <Button
              fullWidth
              onClick={handlePublishRules}
              disabled={!rulesText.trim() || !rulesCountry}
              loading={rulesSaving}
            >
              {!rulesSaving && <FileText size={16} />}
              Опубликовать правила
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

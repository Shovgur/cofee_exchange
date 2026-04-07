'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { createAdminDrink, type AdminDrinkCreate } from '@/lib/api/admin-drinks';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-1.5 sm:gap-4 items-start py-3 border-b border-border last:border-0">
      <div>
        <div className="text-sm font-medium text-white">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </div>
        {hint && <div className="text-[11px] text-muted mt-0.5 leading-snug">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      step="any"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'w-full bg-surface-el border border-border rounded-xl px-3 py-2 text-sm text-white',
        'focus:outline-none focus:border-orange/60 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    />
  );
}

export default function AdminDrinkNewPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    pos_item_id: '',
    defaultSalePrice: '',
    sensitivity: '',
    min_pct: '',
    max_pct: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.defaultSalePrice.trim()) {
      setError('Название и базовая цена обязательны');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: AdminDrinkCreate = {
        name: form.name.trim(),
        pos_item_id: form.pos_item_id.trim() || null,
        defaultSalePrice: parseFloat(form.defaultSalePrice) || 0,
        sensitivity: null,
        min_pct: form.min_pct.trim() ? parseFloat(form.min_pct) : null,
        max_pct: form.max_pct.trim() ? parseFloat(form.max_pct) : null,
      };
      const created = await createAdminDrink(body);
      router.push(`/admin/drinks/${created.drink_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md px-4 lg:px-8 pt-4 lg:pt-8 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-el transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Новый напиток</h1>
            <p className="text-xs text-muted mt-0.5">Создание позиции</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 mt-6 max-w-2xl space-y-4">
        {error && (
          <div className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-2xl p-4">
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <section className="bg-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold">Основные данные</span>
          </div>
          <div className="px-5">
            <Field label="Название" required>
              <TextInput
                value={form.name}
                onChange={v => patch('name', v)}
                placeholder="Например: Капучино"
                disabled={saving}
              />
            </Field>
            <Field label="ID позиции (POS)" hint="Внешний идентификатор из кассовой системы (необязательно)">
              <TextInput
                value={form.pos_item_id}
                onChange={v => patch('pos_item_id', v)}
                placeholder="UUID или строка из iiko"
                disabled={saving}
              />
            </Field>
            <Field label="Базовая цена, ₽" required hint="Стартовое значение, от которого отсчитывается % отклонения">
              <TextInput
                type="number"
                value={form.defaultSalePrice}
                onChange={v => patch('defaultSalePrice', v)}
                placeholder="300"
                disabled={saving}
              />
            </Field>
          </div>
        </section>

        <section className="bg-surface rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <span className="text-sm font-semibold">Параметры движка цен</span>
            <p className="text-[11px] text-muted mt-0.5">Необязательно — если пусто, используются глобальные настройки</p>
          </div>
          <div className="px-5">
            <Field label="Чувствительность" hint="Пока отключено — используется глобальная настройка">
              <TextInput
                type="number"
                value={form.sensitivity}
                onChange={v => patch('sensitivity', v)}
                placeholder="Из глобальных настроек"
                disabled
              />
            </Field>
            <Field label="Мин. отклонение (%)" hint="Нижняя граница изменения цены">
              <TextInput
                type="number"
                value={form.min_pct}
                onChange={v => patch('min_pct', v)}
                placeholder="Из глобальных настроек"
                disabled={saving}
              />
            </Field>
            <Field label="Макс. отклонение (%)" hint="Верхняя граница изменения цены">
              <TextInput
                type="number"
                value={form.max_pct}
                onChange={v => patch('max_pct', v)}
                placeholder="Из глобальных настроек"
                disabled={saving}
              />
            </Field>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Создание…' : 'Создать'}
          </Button>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted hover:text-white transition-colors"
            disabled={saving}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

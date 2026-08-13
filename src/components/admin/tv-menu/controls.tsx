'use client';

import { cn } from '@/lib/utils';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted/80">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
    />
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors hover:bg-surface-el"
    >
      <span className="text-left font-medium">{label}</span>
      <span
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'justify-end bg-orange' : 'justify-start bg-surface-ov',
        )}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-ov p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
            value === o.value
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-muted hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-orange"
    />
  );
}

export function ColorPicker({
  value,
  onChange,
  presets,
  allowEmpty,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  presets: string[];
  allowEmpty?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110',
            value?.toUpperCase() === color.toUpperCase()
              ? 'border-foreground'
              : 'border-transparent',
          )}
          style={{ background: color }}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded-lg border border-border bg-surface"
        title="Свой цвет"
      />
      {allowEmpty && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-auto text-xs text-muted hover:text-foreground"
        >
          Как в теме
        </button>
      )}
    </div>
  );
}

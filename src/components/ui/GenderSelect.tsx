'use client';

import { cn } from '@/lib/utils';

export type Gender = 'male' | 'female';

const OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Мужской',
  female: 'Женский',
};

export default function GenderSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: Gender | null | undefined;
  onChange: (value: Gender | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 rounded-xl bg-surface-ov p-1', className)}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? null : opt.value)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50',
              active
                ? 'bg-orange text-white shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

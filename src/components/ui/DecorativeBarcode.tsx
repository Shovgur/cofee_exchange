'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DecorativeBarcodeProps {
  value: string;
  barCount?: number;
  className?: string;
  codeClassName?: string;
  /** compact — профиль; default — купоны */
  size?: 'compact' | 'default';
}

function isNumericCode(value: string): boolean {
  const stripped = value.replace(/\s/g, '');
  return stripped.length > 0 && /^\d+$/.test(stripped);
}

function formatDisplayCode(value: string, size: 'compact' | 'default'): string {
  const trimmed = value.trim();
  if (!trimmed) return '00000000';

  if (isNumericCode(trimmed)) {
    const digits = trimmed.replace(/\D/g, '');
    const maxLen = size === 'compact' ? 12 : 16;
    const sliced = digits.slice(0, maxLen);
    return sliced.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  const raw = trimmed.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const sliced = size === 'compact' ? raw.slice(-12) : raw.slice(0, 16);
  return sliced.replace(/(.{4})/g, '$1 ').trim() || '0000 0000';
}

export default function DecorativeBarcode({
  value,
  barCount,
  className,
  codeClassName,
  size = 'default',
}: DecorativeBarcodeProps) {
  const normalized = value.replace(/\s/g, '');

  const bars = useMemo(() => {
    const seed = normalized.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
    const count = barCount ?? (size === 'compact' ? 52 : 56);
    return Array.from({ length: count }, (_, i) => ({
      width: 1 + Math.round(Math.abs(Math.sin(seed + i * 2.3)) * 100 % 3),
      height:
        (size === 'compact' ? 28 : 32) +
        Math.round(Math.abs(Math.cos(seed + i * 1.1)) * 100 % (size === 'compact' ? 22 : 24)),
    }));
  }, [normalized, barCount, size]);

  const displayCode = formatDisplayCode(normalized, size);

  return (
    <div
      className={cn(
        'bg-white rounded-2xl flex flex-col items-center',
        size === 'compact' ? 'px-5 py-4 gap-2' : 'p-5 gap-3',
        className,
      )}
    >
      <div className={cn('flex items-end gap-[1.5px]', size === 'compact' ? 'h-12' : 'h-14')}>
        {bars.map((b, i) => (
          <div
            key={i}
            className="rounded-[1px] bg-neutral-900"
            style={{ width: `${b.width}px`, height: `${b.height}px` }}
          />
        ))}
      </div>
      <p
        className={cn(
          'font-mono tabular-nums text-neutral-700',
          size === 'compact'
            ? 'text-xs tracking-[0.18em] text-neutral-600'
            : 'text-sm tracking-[0.2em]',
          codeClassName,
        )}
      >
        {displayCode}
      </p>
    </div>
  );
}

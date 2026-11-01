'use client';

import { Loader2, Save } from 'lucide-react';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

export interface BeanPriceEditableRow {
  beanPrice: number | null;
  editing: boolean;
  editValue: string;
  saving: boolean;
}

export default function BeanPriceCell({
  row,
  onEdit,
  onEditChange,
  onSave,
  size = 'md',
}: {
  row: BeanPriceEditableRow;
  onEdit: () => void;
  onEditChange: (val: string) => void;
  onSave: () => void;
  size?: 'sm' | 'md';
}) {
  const inputCls =
    size === 'sm'
      ? 'w-20 rounded-lg border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange/40 tabular-nums'
      : 'w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40 tabular-nums';
  const btnCls =
    size === 'sm'
      ? 'flex h-6 w-6 items-center justify-center rounded-md bg-orange text-white hover:bg-orange/90 disabled:opacity-50 transition-colors'
      : 'flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white hover:bg-orange/90 disabled:opacity-50 transition-colors';
  const iconSize = size === 'sm' ? 11 : 14;

  if (row.editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={row.editValue}
          onChange={(e) => onEditChange(e.target.value)}
          className={inputCls}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
        />
        <button type="button" onClick={onSave} disabled={row.saving} className={btnCls}>
          {row.saving ? (
            <Loader2 size={iconSize} className="animate-spin" />
          ) : (
            <Save size={iconSize} />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`flex items-center gap-1.5 rounded-lg border border-border bg-surface hover:bg-surface-el transition-colors ${
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      {row.beanPrice != null ? (
        <>
          <span className="tabular-nums font-medium">{row.beanPrice}</span>
          <CoffeeBeanIcon size={size === 'sm' ? 10 : 12} className="text-orange" />
        </>
      ) : (
        <span className="text-muted">— задать</span>
      )}
    </button>
  );
}

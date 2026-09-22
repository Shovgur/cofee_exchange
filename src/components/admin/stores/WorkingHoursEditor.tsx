'use client';

import type { StoreWorkingHours, StoreWorkingHoursDay } from '@/lib/api/loyalty/stores';

const DAYS: { key: keyof StoreWorkingHours; label: string }[] = [
  { key: 'mon', label: 'Понедельник' },
  { key: 'tue', label: 'Вторник' },
  { key: 'wed', label: 'Среда' },
  { key: 'thu', label: 'Четверг' },
  { key: 'fri', label: 'Пятница' },
  { key: 'sat', label: 'Суббота' },
  { key: 'sun', label: 'Воскресенье' },
];

const DEFAULT_SLOT = { open: '08:00', close: '22:00' };

function emptyHours(): StoreWorkingHours {
  return {};
}

export function normalizeWorkingHours(raw: StoreWorkingHours | null | undefined): StoreWorkingHours {
  const out: StoreWorkingHours = {};
  for (const { key } of DAYS) {
    const v = raw?.[key];
    if (v && v.open && v.close) out[key] = { open: v.open, close: v.close };
    else out[key] = null;
  }
  return out;
}

export default function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: StoreWorkingHours;
  onChange: (next: StoreWorkingHours) => void;
}) {
  const hours = normalizeWorkingHours(value);

  const setDay = (key: keyof StoreWorkingHours, day: StoreWorkingHoursDay) => {
    onChange({ ...hours, [key]: day });
  };

  const applyToAll = () => {
    const mon = hours.mon ?? DEFAULT_SLOT;
    const slot = { open: mon.open, close: mon.close };
    const next: StoreWorkingHours = {};
    for (const { key } of DAYS) next[key] = { ...slot };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">График работы</p>
        <button
          type="button"
          onClick={applyToAll}
          className="text-xs text-orange hover:underline"
        >
          Как в понедельнике — на все дни
        </button>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const off = hours[key] == null;
          const slot = hours[key] ?? DEFAULT_SLOT;
          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-xl border border-border bg-surface-el/50 px-3 py-2 sm:grid-cols-[minmax(0,7rem)_auto_1fr_1fr]"
            >
              <span className="text-sm">{label}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={off}
                  onChange={(e) => setDay(key, e.target.checked ? null : { ...DEFAULT_SLOT })}
                />
                Выходной
              </label>
              <input
                type="time"
                disabled={off}
                value={slot.open}
                onChange={(e) => setDay(key, { open: e.target.value, close: slot.close })}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm disabled:opacity-40"
              />
              <input
                type="time"
                disabled={off}
                value={slot.close}
                onChange={(e) => setDay(key, { open: slot.open, close: e.target.value })}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { emptyHours };

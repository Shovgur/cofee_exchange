'use client';

import DecorativeBarcode from '@/components/ui/DecorativeBarcode';

export default function ProfileBarcode({ value }: { value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted px-1">
        Личный штрихкод
      </p>
      <DecorativeBarcode value={value} size="compact" />
    </div>
  );
}

'use client';

import DecorativeBarcode from '@/components/ui/DecorativeBarcode';

export default function ProfileBarcode({ value }: { value: string }) {
  return <DecorativeBarcode value={value} size="compact" />;
}

'use client';

import { useRouter } from 'next/navigation';
import { Rocket } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PageProps {
  params: { drinkId: string };
}

export default function IpoDrinkPage(_props: PageProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/15">
        <Rocket size={28} className="text-orange" />
      </div>
      <h1 className="text-xl font-bold">IPO напитков</h1>
      <p className="text-sm text-muted max-w-sm">
        Раздел скоро появится в приложении.
      </p>
      <Button variant="secondary" onClick={() => router.back()}>
        Назад
      </Button>
    </div>
  );
}

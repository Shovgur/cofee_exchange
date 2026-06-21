'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function PaymentResultPage() {
  const router = useRouter();
  const { refreshCoupons } = useAuth();
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (let i = 1; i <= 8; i++) {
        if (cancelled) return;
        setAttempts(i);
        try {
          await refreshCoupons();
        } catch {
          /* continue */
        }
        if (i < 8) await sleep(2500);
      }
      if (!cancelled) setReady(true);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [refreshCoupons]);

  return (
    <div className="mx-auto flex min-h-lvh max-w-lg flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      {!ready ? (
        <>
          <Clock size={48} className="text-orange animate-pulse" />
          <h1 className="text-xl font-bold">Обрабатываем оплату…</h1>
          <p className="text-sm text-muted">
            Обновляем купоны ({attempts}/8). Обычно это занимает несколько секунд.
          </p>
        </>
      ) : (
        <>
          <CheckCircle size={48} className="text-success" />
          <h1 className="text-xl font-bold">Готово</h1>
          <p className="text-sm text-muted">
            Если купон ещё не появился — откройте «Купоны» через минуту.
          </p>
          <Button fullWidth onClick={() => router.replace('/coupons')}>
            К купонам
          </Button>
        </>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

export default function AuthGate({
  children,
  fallbackMessage = 'Этот раздел доступен только после входа в аккаунт.',
}: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-8 text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-surface-el flex items-center justify-center">
          <Lock size={28} className="text-orange" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Нужна авторизация</h2>
          <p className="text-muted text-sm leading-relaxed">{fallbackMessage}</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push('/auth/login')}
          >
            Войти в аккаунт
          </Button>
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => router.push('/auth/login?mode=register')}
          >
            Зарегистрироваться
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

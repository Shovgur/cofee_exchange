'use client';

import Link from 'next/link';
import { Monitor } from 'lucide-react';
import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';

export default function AdminDesktopOnly({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="hidden min-h-lvh lg:block">{children}</div>
      <div className="flex min-h-lvh flex-col items-center justify-center gap-6 bg-bg px-8 text-center lg:hidden">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/15">
          <Monitor size={32} className="text-orange" />
        </div>
        <div className="max-w-sm space-y-2">
          <h1 className="text-xl font-bold">Только для компьютера</h1>
          <p className="text-sm leading-relaxed text-muted">
            Админ-панель открывается на отдельном адресе и доступна с экрана от 1024px.
            Откройте сайт на ноутбуке или ПК.
          </p>
        </div>
        <Link href="/feed">
          <Button size="lg">Вернуться в приложение</Button>
        </Link>
      </div>
    </>
  );
}

'use client';

import { User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: '/admin/settings', title: 'Настройки' },
  { prefix: '/admin/drinks', title: 'Напитки' },
  { prefix: '/admin/sales', title: 'Продажи' },
  { prefix: '/admin/loyalty/settings', title: 'Программа лояльности' },
  { prefix: '/admin/loyalty/bean-prices', title: 'Цены в Бинах' },
  { prefix: '/admin/loyalty/alerts', title: 'Алерты антифрода' },
  { prefix: '/admin/loyalty/users', title: 'Карточка пользователя' },
  { prefix: '/admin/loyalty', title: 'Пользователи лояльности' },
];

function pageTitle(pathname: string, userName: string | undefined): string {
  if (pathname === '/admin') return userName?.trim() || 'Аккаунт';
  const match = PAGE_TITLES.find(({ prefix }) => pathname.startsWith(prefix));
  return match?.title ?? 'Админ-панель';
}

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const title = pageTitle(pathname, user.name);
  const isAccount = pathname === '/admin';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg/95 px-8 backdrop-blur-md">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {isAccount ? 'Профиль администратора' : 'Раздел'}
        </p>
        <p className="truncate text-lg font-semibold leading-tight">{title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted tabular-nums">{user.phone}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15">
          <User size={20} className="text-orange" />
        </div>
      </div>
    </header>
  );
}

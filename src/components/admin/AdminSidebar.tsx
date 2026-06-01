'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  SlidersHorizontal,
  GlassWater,
  ShoppingCart,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const SECTION_NAV = [
  { href: '/admin/settings', icon: SlidersHorizontal, label: 'Настройки', exact: false },
  { href: '/admin/drinks', icon: GlassWater, label: 'Напитки', exact: false },
  { href: '/admin/sales', icon: ShoppingCart, label: 'Продажи', exact: false },
] as const;

function accountNavLabel(name: string | undefined): string {
  const n = name?.trim();
  if (!n) return 'Аккаунт';
  return n.length > 20 ? `${n.slice(0, 18)}…` : n;
}

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  if (href === '/admin/drinks') {
    return pathname.startsWith('/admin/drinks');
  }
  return pathname.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <aside className="fixed top-0 left-0 z-[10050] flex h-screen w-64 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange/20 text-xl">
              ☕
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">
                Coffee <span className="text-orange">Exchange</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Админ-панель
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <Link
            href="/admin"
            title={user?.name ?? 'Аккаунт'}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === '/admin'
                ? 'bg-orange/15 text-orange'
                : 'text-muted hover:bg-surface-el hover:text-foreground',
            )}
          >
            <User
              size={18}
              strokeWidth={pathname === '/admin' ? 2.5 : 1.8}
              className="shrink-0"
            />
            <span className="min-w-0 truncate">{accountNavLabel(user?.name)}</span>
            {pathname === '/admin' && (
              <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
            )}
          </Link>

          {SECTION_NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-orange/15 text-orange'
                    : 'text-muted hover:bg-surface-el hover:text-foreground',
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
                {label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border px-3 py-4">
          <Link
            href="/feed"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-el hover:text-foreground"
          >
            <ArrowLeft size={18} className="shrink-0" />
            В приложение
          </Link>
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={18} className="shrink-0" />
            Выйти
          </button>
        </div>
      </aside>

      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Выход из аккаунта">
        <p className="mb-5 text-sm text-muted">Вы уверены, что хотите выйти?</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowLogout(false)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              logout();
              setShowLogout(false);
              router.push('/feed');
            }}
          >
            Выйти
          </Button>
        </div>
      </Modal>
    </>
  );
}

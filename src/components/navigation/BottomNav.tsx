'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, MapPin, Coffee, Ticket, LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS_GUEST = [
  { href: '/feed', icon: Newspaper, label: 'Лента' },
  { href: '/map', icon: MapPin, label: 'Карта' },
  { href: '/menu', icon: Coffee, label: 'Меню' },
  { href: '/coupons', icon: Ticket, label: 'Купоны' },
  { href: '/auth/login', icon: LogIn, label: 'Войти' },
];

const NAV_ITEMS_AUTH = [
  { href: '/feed', icon: Newspaper, label: 'Лента' },
  { href: '/map', icon: MapPin, label: 'Карта' },
  { href: '/menu', icon: Coffee, label: 'Меню' },
  { href: '/coupons', icon: Ticket, label: 'Купоны' },
  { href: '/profile', icon: User, label: 'Профиль' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const items = user ? NAV_ITEMS_AUTH : NAV_ITEMS_GUEST;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-[10050] lg:hidden flex flex-col',
        'bg-bg shadow-[0_-4px_16px_rgba(47,36,28,0.08)]',
      )}
    >
      <div className="flex items-stretch max-w-lg mx-auto w-full">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/feed'
              ? pathname === '/feed' || pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1',
                'transition-colors duration-150',
                isActive ? 'text-orange' : 'text-muted hover:text-foreground',
              )}
            >
              <Icon
                size={22}
                className={cn(
                  'transition-transform duration-150',
                  isActive && 'scale-110',
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
      <div
        className="h-safe-area-bottom w-full shrink-0 bg-bg"
        aria-hidden
      />
    </nav>
  );
}

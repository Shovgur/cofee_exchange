'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Newspaper, MapPin, Coffee, Ticket, LogIn, User,
  Globe, Star, LogOut, ChevronRight, Timer,
} from 'lucide-react';
import { cn, formatCountdown } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { usePrices } from '@/contexts/PricesContext';
import { useState } from 'react';
import CountrySelector from '@/components/country/CountrySelector';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const NAV_ITEMS = [
  { href: '/feed', icon: Newspaper, label: 'Лента' },
  { href: '/map', icon: MapPin, label: 'Карта' },
  { href: '/menu', icon: Coffee, label: 'Меню' },
  { href: '/coupons', icon: Ticket, label: 'Купоны' },
];

const LOYALTY_COLORS: Record<string, string> = {
  Bronze: 'text-amber-500',
  Silver: 'text-slate-400',
  Gold: 'text-yellow-400',
  Platinum: 'text-cyan-400',
};

export default function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { country } = useCountry();

  const { secondsLeft } = usePrices();
  const [showCountry, setShowCountry] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-surface border-r border-border z-[10050]">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange/20 flex items-center justify-center text-xl flex-shrink-0">
              ☕
            </div>
            <div>
              <span className="font-bold text-lg leading-none">Coffee</span>
              <span className="font-bold text-lg text-orange leading-none"> Exchange</span>
              <div className="text-[10px] text-muted mt-0.5 tracking-wider uppercase">Биржа напитков</div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/feed'
                ? pathname === '/feed' || pathname === '/'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-orange/15 text-orange'
                    : 'text-muted hover:bg-surface-el hover:text-white',
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={cn('flex-shrink-0', isActive && 'scale-105')}
                />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Countdown timer */}
        <div className="mx-3 mb-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-orange/8 border border-orange/15">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange/15">
            <Timer size={13} className="text-orange" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-muted uppercase tracking-wider leading-none mb-0.5">
              До обновления цен
            </div>
            <div className="text-base font-mono font-bold tabular-nums text-orange leading-none">
              {formatCountdown(secondsLeft * 1000)}
            </div>
          </div>
        </div>

        {/* Bottom: profile / auth + country */}
        <div className="px-3 pb-6 space-y-2 border-t border-border pt-4">
          {/* Country switcher */}
          <button
            onClick={() => setShowCountry(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-el transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-muted flex-shrink-0" />
              <span className="text-sm text-muted">
                {country.flag} {country.name}
              </span>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>

          {user ? (
            <>
              {/* Profile link */}
              <Link
                href="/profile"
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                  pathname === '/profile'
                    ? 'bg-orange/15 text-orange'
                    : 'hover:bg-surface-el text-muted hover:text-white',
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-orange/20 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-orange" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">{user.name}</div>
                  <div className={cn('text-[11px] flex items-center gap-0.5', LOYALTY_COLORS[user.loyaltyLevel] ?? 'text-muted')}>
                    <Star size={9} fill="currentColor" />
                    {user.loyaltyLevel}
                  </div>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={() => setShowLogout(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <LogOut size={16} className="flex-shrink-0" />
                <span className="text-sm">Выйти</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-orange/10 text-orange hover:bg-orange/20 transition-colors"
            >
              <LogIn size={16} className="flex-shrink-0" />
              <span className="text-sm font-medium">Войти / Регистрация</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Country selector */}
      <CountrySelector open={showCountry} onClose={() => setShowCountry(false)} />

      {/* Logout confirm */}
      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Выход из аккаунта">
        <p className="text-muted text-sm mb-5">
          Вы уверены, что хотите выйти?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowLogout(false)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => { logout(); setShowLogout(false); router.push('/feed'); }}
          >
            Выйти
          </Button>
        </div>
      </Modal>
    </>
  );
}

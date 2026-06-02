'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Globe,
  Shield,
  History,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import AuthGate from '@/components/auth/AuthGate';
import CountrySelector from '@/components/country/CountrySelector';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';
import { formatDateTime, cn } from '@/lib/utils';

function NotificationItem({ title, subtitle, enabled, onToggle }: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted mt-0.5">{subtitle}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={cn(
          'flex h-6 w-11 flex-shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          enabled ? 'justify-end bg-orange' : 'justify-start bg-surface-ov',
        )}
      >
        <span className="pointer-events-none h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-black/5" />
      </button>
    </div>
  );
}

function ProfileBarcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    const seed = value.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
    return Array.from({ length: 52 }, (_, i) => ({
      width: 1 + Math.round(Math.abs(Math.sin(seed + i * 2.3)) * 100 % 3),
      height: 28 + Math.round(Math.abs(Math.cos(seed + i * 1.1)) * 100 % 22),
    }));
  }, [value]);

  const displayCode = value.replace(/\D/g, '').slice(-12).replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="bg-white rounded-2xl px-5 py-4 flex flex-col items-center gap-2">
      <div className="flex items-end gap-[1.5px] h-12">
        {bars.map((b, i) => (
          <div
            key={i}
            className="rounded-[1px] bg-neutral-900"
            style={{ width: `${b.width}px`, height: `${b.height}px` }}
          />
        ))}
      </div>
      <p className="font-mono text-xs tracking-[0.18em] text-neutral-600 tabular-nums">
        {displayCode || '0000 0000 0000'}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, coupons } = useAuth();
  const { country } = useCountry();
  const router = useRouter();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBalanceHelp, setShowBalanceHelp] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    priceAlerts: true,
    promotions: true,
    newDrinks: false,
    orderStatus: true,
  });

  const barcodeValue = useMemo(() => {
    if (!user) return '000000000000';
    const d = user.phone.replace(/\D/g, '');
    return (d.slice(-12) || user.id.replace(/\D/g, '').slice(-12)).padStart(12, '0');
  }, [user]);

  const userCoupons = coupons.filter((c) => c.countryId === country.id);

  function toggleNotif(key: keyof typeof notifSettings) {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AuthGate fallbackMessage="Войдите в аккаунт, чтобы видеть профиль, историю покупок и настройки.">
      {user && (
        <div className="pb-nav-safe max-w-2xl lg:mx-8 lg:pt-8 lg:pb-6 w-full">
          {/* Header */}
          <div className="px-4 pt-6 pb-5 lg:px-0 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center flex-shrink-0">
                <User size={28} className="text-orange" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">{user.name}</h1>
                <p className="text-sm text-muted truncate">{user.phone}</p>
              </div>
            </div>

            {/* Barcode under user info */}
            <ProfileBarcode value={barcodeValue} />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative bg-surface rounded-2xl p-3 text-center border border-border min-h-[5.25rem]">
                <button
                  type="button"
                  onClick={() => setShowBalanceHelp(true)}
                  aria-label="Что такое Бины"
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-el text-muted transition-colors hover:bg-surface-ov hover:text-foreground"
                >
                  <CircleHelp size={14} strokeWidth={2} />
                </button>
                <div className="text-lg font-bold text-orange tabular-nums">
                  {new Intl.NumberFormat('ru-RU').format(user.loyaltyPoints)}
                </div>
                <div className="text-[11px] text-muted mt-1 flex items-center justify-center gap-1">
                  Баланс
                  <CoffeeBeanIcon size={12} className="shrink-0" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="bg-surface rounded-2xl p-3 text-center border border-border hover:bg-surface-el transition-colors flex flex-col items-center justify-center gap-1 min-h-[5.25rem]"
              >
                <History size={18} className="text-orange" />
                <span className="text-xs font-medium leading-tight">История</span>
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="px-4 lg:px-0 space-y-3">
            {/* Account menu */}
            <div className="bg-surface rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Аккаунт</h2>
              </div>

              {[
                {
                  icon: Bell,
                  label: 'Уведомления',
                  onClick: () => setShowNotifs(true),
                  badge: Object.values(notifSettings).filter(Boolean).length + ' вкл.',
                },
                {
                  icon: CreditCard,
                  label: 'Привязанные карты',
                  onClick: () => {},
                  badge: 'Скоро',
                  disabled: true,
                },
                {
                  icon: Globe,
                  label: 'Страна',
                  onClick: () => setShowCountry(true),
                  badge: `${country.flag} ${country.name}`,
                },
                {
                  icon: Shield,
                  label: 'Безопасность',
                  onClick: () => {},
                  badge: 'Скоро',
                  disabled: true,
                },
              ].map(({ icon: Icon, label, onClick, badge, disabled }) => (
                <button
                  key={label}
                  onClick={disabled ? undefined : onClick}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0 transition-colors',
                    disabled ? 'opacity-50 cursor-default' : 'hover:bg-surface-el',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-muted" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="text-xs text-muted">{badge}</span>
                    )}
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="bg-surface rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Прочее</h2>
              </div>
              {[
                { icon: HelpCircle, label: 'Поддержка', disabled: true },
                { icon: Info, label: 'О приложении', disabled: true },
                { icon: Settings, label: 'Настройки', disabled: true },
              ].map(({ icon: Icon, label, disabled }) => (
                <button
                  key={label}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0',
                    disabled ? 'opacity-50' : 'hover:bg-surface-el transition-colors',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-muted" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLogout(true)}
              className="w-full flex items-center gap-3 bg-danger/10 rounded-2xl px-4 py-4 text-danger hover:bg-danger/20 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      )}

      <Modal
        open={showBalanceHelp}
        onClose={() => setShowBalanceHelp(false)}
        title="Что такое Бины"
      >
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            <span className="font-medium text-foreground">Бины</span> — внутренняя
            валюта Coffee Exchange. Ими можно оплачивать напитки вместо рублей при
            оформлении заказа в приложении.
          </p>
          <p>
            Бины начисляются за покупки в кофейнях сети: покажите штрихкод из профиля
            на кассе, и баланс пополнится после оплаты.
          </p>
          <p>
            Стоимость напитка в Бинах указана рядом с ценой в рублях. Баланс
            привязан к вашему аккаунту и сохраняется при смене страны в настройках.
          </p>
        </div>
        <Button
          fullWidth
          className="mt-5"
          onClick={() => setShowBalanceHelp(false)}
        >
          Понятно
        </Button>
      </Modal>

      {/* History modal */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="История покупок">
        {userCoupons.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">Нет покупок</p>
        ) : (
          <div className="divide-y divide-border/60 -mx-6 px-6">
            {userCoupons.slice(0, 20).map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">
                    {coupon.category === 'coffee' ? '☕' : coupon.category === 'lemonade' ? '🍋' : '🍵'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{coupon.drinkName}</div>
                    <div className="text-xs text-muted">{formatDateTime(coupon.purchasedAt)}</div>
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0">
                  {Math.round(coupon.purchasePrice)} {coupon.currencySymbol}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Notifications modal */}
      <Modal open={showNotifs} onClose={() => setShowNotifs(false)} title="Уведомления">
        <div className="divide-y divide-border">
          <NotificationItem
            title="Изменения цен"
            subtitle="Когда цена на отслеживаемые напитки меняется"
            enabled={notifSettings.priceAlerts}
            onToggle={() => toggleNotif('priceAlerts')}
          />
          <NotificationItem
            title="Акции и скидки"
            subtitle="Специальные предложения и промо"
            enabled={notifSettings.promotions}
            onToggle={() => toggleNotif('promotions')}
          />
          <NotificationItem
            title="Новые напитки"
            subtitle="Когда в меню появляется что-то новое"
            enabled={notifSettings.newDrinks}
            onToggle={() => toggleNotif('newDrinks')}
          />
          <NotificationItem
            title="Статус заказа"
            subtitle="Информация о купонах и покупках"
            enabled={notifSettings.orderStatus}
            onToggle={() => toggleNotif('orderStatus')}
          />
        </div>
        <p className="text-xs text-muted mt-4 text-center">
          Push-уведомления будут доступны в следующей версии
        </p>
      </Modal>

      {/* Country selector */}
      <CountrySelector open={showCountry} onClose={() => setShowCountry(false)} />

      {/* Logout confirm */}
      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Выход из аккаунта">
        <p className="text-muted text-sm mb-5">
          Вы уверены, что хотите выйти? Купоны сохранятся на устройстве.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowLogout(false)}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              logout();
              router.push('/feed');
            }}
          >
            Выйти
          </Button>
        </div>
      </Modal>
    </AuthGate>
  );
}

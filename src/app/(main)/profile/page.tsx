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
  Trophy,
  Barcode,
  History,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import AuthGate from '@/components/auth/AuthGate';
import CountrySelector from '@/components/country/CountrySelector';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import MyCodeModal from '@/components/profile/MyCodeModal';
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


export default function ProfilePage() {
  const { user, logout, coupons } = useAuth();
  const { country } = useCountry();
  const router = useRouter();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showMyCode, setShowMyCode] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    priceAlerts: true,
    promotions: true,
    newDrinks: false,
    orderStatus: true,
  });

  const barcodeDisplay = useMemo(() => {
    if (!user) return '1234 5678';
    const d = user.phone.replace(/\D/g, '');
    const tail = (d.slice(-8) || user.id.replace(/\D/g, '').slice(-8)).padStart(8, '0');
    return `${tail.slice(0, 4)} ${tail.slice(4)}`;
  }, [user]);

  const qrPayload = useMemo(
    () => (user ? `CE:USER:${user.id}:${user.phone}` : ''),
    [user],
  );

  function toggleNotif(key: keyof typeof notifSettings) {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AuthGate fallbackMessage="Войдите в аккаунт, чтобы видеть профиль, историю покупок и настройки.">
      {user && (
        <div className="pb-6 max-w-2xl lg:mx-8 lg:pt-8 w-full">
          {/* Header */}
          <div className="px-4 pt-6 pb-5 lg:px-0">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center flex-shrink-0">
                <User size={28} className="text-orange" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">{user.name}</h1>
                <p className="text-sm text-muted truncate">{user.phone}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMyCode(true)}
              className="w-full flex items-center gap-4 bg-surface rounded-2xl p-4 mb-3 border border-border hover:bg-surface-el transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange/15 flex items-center justify-center flex-shrink-0">
                <Barcode size={22} className="text-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Мой код</div>
                <div className="text-xs text-muted mt-0.5">
                  Штрихкод для начисления Бинов
                </div>
              </div>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </button>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-2xl p-3 text-center border border-border">
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
                onClick={() =>
                  document.getElementById('profile-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="bg-surface rounded-2xl p-3 text-center border border-border hover:bg-surface-el transition-colors flex flex-col items-center justify-center gap-1 min-h-[5.25rem]"
              >
                <History size={18} className="text-orange" />
                <span className="text-xs font-medium leading-tight">История</span>
              </button>
              <div className="bg-surface rounded-2xl p-3 text-center border border-border opacity-55 flex flex-col items-center justify-center gap-1 min-h-[5.25rem]">
                <Trophy size={18} className="text-muted" />
                <span className="text-[11px] font-medium leading-tight text-muted">
                  Достижения
                  <span className="block text-[10px] mt-0.5">(скоро)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="px-4 lg:px-0 space-y-3">
            {/* History */}
            <div id="profile-history" className="bg-surface rounded-2xl overflow-hidden scroll-mt-24">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">История</h2>
              </div>
              {coupons.filter((c) => c.countryId === country.id).slice(0, 5).length === 0 ? (
                <div className="px-4 py-4 text-sm text-muted">Нет покупок</div>
              ) : (
                <div>
                  {coupons.filter((c) => c.countryId === country.id).slice(0, 5).map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {coupon.category === 'coffee' ? '☕' : coupon.category === 'lemonade' ? '🍋' : '🍵'}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{coupon.drinkName}</div>
                          <div className="text-xs text-muted">{formatDateTime(coupon.purchasedAt)}</div>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(coupon.purchasePrice)} {coupon.currencySymbol}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu items */}
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
                {
                  icon: Trophy,
                  label: 'Достижения',
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

      <MyCodeModal
        open={showMyCode && !!user}
        onClose={() => setShowMyCode(false)}
        displayCode={barcodeDisplay}
        qrPayload={qrPayload}
      />

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

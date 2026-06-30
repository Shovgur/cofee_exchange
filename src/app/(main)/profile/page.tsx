'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileBarcode from '@/components/profile/ProfileBarcode';
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
  Trophy,
  Pencil,
  FileText,
  Loader2,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  TimerReset,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import AuthGate from '@/components/auth/AuthGate';
import CountrySelector from '@/components/country/CountrySelector';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';
import { formatDateTime, cn } from '@/lib/utils';
import {
  fetchUserBarcode,
  fetchLoyaltyTransactions,
  patchCurrentUser,
  fetchRules,
  type ApiLoyaltyTransaction,
} from '@/lib/api/loyalty';

// ── Helpers ───────────────────────────────────────────────────────────────

function NotificationItem({
  title, subtitle, enabled, onToggle,
}: { title: string; subtitle: string; enabled: boolean; onToggle: () => void }) {
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

// ── Bean transaction history ──────────────────────────────────────────────

function txIcon(type: ApiLoyaltyTransaction['type']) {
  if (type === 'accrual') return <ArrowDownCircle size={18} className="text-green-500 shrink-0" />;
  if (type === 'spend') return <ArrowUpCircle size={18} className="text-orange shrink-0" />;
  return <TimerReset size={18} className="text-muted shrink-0" />;
}

function txLabel(type: ApiLoyaltyTransaction['type']) {
  if (type === 'accrual') return 'Начисление';
  if (type === 'spend') return 'Списание';
  return 'Сгорание';
}

function BeanHistoryTab() {
  const [txs, setTxs] = useState<ApiLoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyTransactions({ limit: 30 })
      .then((page) => setTxs(page.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={22} className="animate-spin text-muted" />
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-danger text-center py-6">{error}</p>;
  }
  if (txs.length === 0) {
    return <p className="text-sm text-muted text-center py-6">Операций пока нет</p>;
  }

  return (
    <div className="divide-y divide-border/60 -mx-6 px-6">
      {txs.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {txIcon(tx.type)}
            <div className="min-w-0">
              <div className="text-sm font-medium">{txLabel(tx.type)}</div>
              {tx.comment && <div className="text-xs text-muted truncate">{tx.comment}</div>}
              <div className="text-xs text-muted">{formatDateTime(tx.created_at)}</div>
            </div>
          </div>
          <span className={cn(
            'text-sm font-semibold shrink-0 tabular-nums flex items-center gap-1',
            tx.type === 'accrual' ? 'text-green-500' : 'text-muted',
          )}>
            {tx.type === 'accrual' ? '+' : '−'}{Math.abs(tx.amount)}
            <CoffeeBeanIcon size={12} />
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────

function EditProfileModal({
  open,
  onClose,
  initialValues,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initialValues: { first_name: string; last_name: string; middle_name: string; birth_date: string; email: string };
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setForm(initialValues);
  }, [open, initialValues]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await patchCurrentUser({
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        middle_name: form.middle_name || null,
        birth_date: form.birth_date || undefined,
        email: form.email || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Редактировать профиль">
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
        )}
        {([
          { key: 'last_name', label: 'Фамилия', type: 'text' },
          { key: 'first_name', label: 'Имя', type: 'text' },
          { key: 'middle_name', label: 'Отчество', type: 'text' },
          { key: 'birth_date', label: 'Дата рождения', type: 'date' },
          { key: 'email', label: 'Email', type: 'email' },
        ] as const).map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={set(key)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button fullWidth disabled={saving} onClick={handleSave} className="flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Rules modal ───────────────────────────────────────────────────────────

function RulesModal({ open, onClose, countryCode }: { open: boolean; onClose: () => void; countryCode: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || text !== null) return;
    setLoading(true);
    fetchRules(countryCode)
      .then((r) => setText(r.text))
      .catch(() => setText('Не удалось загрузить правила.'))
      .finally(() => setLoading(false));
  }, [open, countryCode, text]);

  return (
    <Modal open={open} onClose={onClose} title="Правила программы лояльности">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto text-sm text-muted leading-relaxed whitespace-pre-wrap pr-1">
          {text}
        </div>
      )}
      <Button fullWidth className="mt-5" onClick={onClose}>Закрыть</Button>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, coupons, refreshUserData, isDemo } = useAuth();
  const { country } = useCountry();
  const router = useRouter();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<'coupons' | 'beans'>('coupons');
  const [showBalanceHelp, setShowBalanceHelp] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    priceAlerts: true,
    promotions: true,
    newDrinks: false,
    orderStatus: true,
  });

  // Личный штрихкод из GET /users/me/barcode (числовой code)
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    fetchUserBarcode()
      .then((b) => setBarcodeValue(b.code))
      .catch(() => {
        setBarcodeValue(user.userCode ?? null);
      });
  }, [user]);

  const displayBarcode = barcodeValue ?? user?.userCode ?? '00000000';

  const userCoupons = coupons.filter((c) => c.countryId === country.id);

  useEffect(() => {
    void refreshUserData();
  }, [refreshUserData]);

  function toggleNotif(key: keyof typeof notifSettings) {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const editInitialValues = useMemo(() => ({
    first_name: user?.firstName ?? '',
    last_name: user?.lastName ?? '',
    middle_name: user?.middleName ?? '',
    birth_date: user?.birthDate ?? '',
    email: user?.email ?? '',
  }), [user]);

  return (
    <AuthGate fallbackMessage="Войдите в аккаунт, чтобы видеть профиль, историю покупок и настройки.">
      {user && (
        <div className="max-w-2xl lg:mx-8 lg:pt-8 lg:pb-6 w-full">
          {/* Header */}
          <div className="px-4 pt-6 pb-5 lg:px-0 space-y-4">
            {/* User info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange/20 flex items-center justify-center flex-shrink-0">
                <User size={28} className="text-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold truncate">{user.name}</h1>
                <p className="text-sm text-muted truncate">{user.phone}</p>
                {isDemo && (
                  <span className="mt-1 inline-block rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange">
                    Демо-режим
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                aria-label="Редактировать профиль"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-surface-el hover:text-foreground transition-colors"
              >
                <Pencil size={15} />
              </button>
            </div>

            {/* Barcode under user info */}
            <ProfileBarcode value={displayBarcode} />

            <div className="grid grid-cols-3 gap-3">
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
                onClick={() => { setShowHistory(true); setHistoryTab('coupons'); }}
                className="bg-surface rounded-2xl p-3 text-center border border-border hover:bg-surface-el transition-colors flex flex-col items-center justify-center gap-1 min-h-[5.25rem]"
              >
                <History size={18} className="text-orange" />
                <span className="text-xs font-medium leading-tight">История</span>
              </button>

              <div
                aria-disabled
                className="bg-surface rounded-2xl p-3 text-center border border-border opacity-55 flex flex-col items-center justify-center gap-1 min-h-[5.25rem] cursor-default"
              >
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
                { icon: FileText, label: 'Правила программы', onClick: () => setShowRules(true), disabled: false },
                { icon: HelpCircle, label: 'Поддержка', disabled: true },
                { icon: Info, label: 'О приложении', disabled: true },
                { icon: Settings, label: 'Настройки', disabled: true },
              ].map(({ icon: Icon, label, onClick, disabled }) => (
                <button
                  key={label}
                  onClick={disabled ? undefined : onClick}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0',
                    disabled ? 'opacity-50 cursor-default' : 'hover:bg-surface-el transition-colors',
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

      {/* Balance help modal */}
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

      {/* History modal with tabs */}
      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="История">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-surface-ov p-1 mb-4 -mx-1">
          <button
            type="button"
            onClick={() => setHistoryTab('coupons')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
              historyTab === 'coupons' ? 'bg-surface shadow-sm text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            Купоны
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab('beans')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors',
              historyTab === 'beans' ? 'bg-surface shadow-sm text-foreground' : 'text-muted hover:text-foreground',
            )}
          >
            Бины
          </button>
        </div>

        {/* Coupon tab */}
        {historyTab === 'coupons' && (
          userCoupons.length === 0 ? (
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
          )
        )}

        {/* Beans tab */}
        {historyTab === 'beans' && <BeanHistoryTab />}
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

      {/* Edit profile modal */}
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        initialValues={editInitialValues}
        onSaved={() => refreshUserData()}
      />

      {/* Rules modal */}
      <RulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
        countryCode={country.id}
      />

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
            onClick={async () => {
              await logout();
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

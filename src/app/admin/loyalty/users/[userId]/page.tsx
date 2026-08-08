'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Hash,
  Globe,
  Mail,
  Calendar,
  ShieldBan,
  ShieldCheck,
  Ticket,
  CreditCard,
  Clock,
  Loader2,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  GiftIcon,
  Users2,
} from 'lucide-react';
import {
  adminGetUser,
  adminGetUserAuthEvents,
  adminGetUserCoupons,
  adminGetUserTransactions,
  adminAccrueBeans,
  adminSpendBeans,
  adminBlockUser,
  adminUnblockUser,
  adminCancelCoupon,
  adminUpdateUser,
  adminIssueCoupon,
  type AdminUserCardOut,
  type AuthEventOut,
} from '@/lib/api/loyalty/admin';
import { fetchMenu, fetchMenuItem } from '@/lib/api/loyalty/catalog';
import type {
  ApiCoupon,
  ApiLoyaltyTransaction,
  ApiMenuItem,
  ApiMenuModifier,
} from '@/lib/api/loyalty/types';
import {
  cn,
  formatDateTime,
  couponStatusLabel,
  couponStatusColor,
} from '@/lib/utils';
import {
  transactionLabel,
  isCredit,
  formatSignedBeans,
} from '@/lib/loyalty/transactions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';
import GenderSelect, { type Gender, GENDER_LABELS } from '@/components/ui/GenderSelect';

type Tab = 'profile' | 'coupons' | 'beans' | 'events';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Профиль' },
  { id: 'coupons', label: 'Купоны' },
  { id: 'beans', label: 'История Бинов' },
  { id: 'events', label: 'Входы' },
];

function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-muted">{text}</p>;
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 size={22} className="animate-spin text-muted" />
    </div>
  );
}

// ── Bean operations ───────────────────────────────────────────────────────

function BeanOpModal({
  open,
  onClose,
  onConfirm,
  mode,
  setMode,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (beans: number, comment: string) => void;
  mode: 'accrue' | 'spend';
  setMode: (m: 'accrue' | 'spend') => void;
  loading: boolean;
}) {
  const [beans, setBeans] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!open) { setBeans(''); setComment(''); }
  }, [open]);

  const handleConfirm = () => {
    const n = parseInt(beans, 10);
    if (!n || n < 1) return;
    onConfirm(n, comment);
  };

  return (
    <Modal open={open} onClose={onClose} title="Операции с Бинами">
      <div className="space-y-4">
        <div className="flex rounded-xl bg-surface-ov p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode('accrue')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
              mode === 'accrue' ? 'bg-surface shadow-sm text-green-600' : 'text-muted hover:text-foreground',
            )}
          >
            <PlusCircle size={14} /> Начислить
          </button>
          <button
            type="button"
            onClick={() => setMode('spend')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
              mode === 'spend' ? 'bg-surface shadow-sm text-danger' : 'text-muted hover:text-foreground',
            )}
          >
            <MinusCircle size={14} /> Списать
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Количество Бинов</label>
          <input
            type="number"
            min="1"
            value={beans}
            onChange={(e) => setBeans(e.target.value)}
            placeholder="Например: 100"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Комментарий (необязательно)</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Причина операции"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button
            fullWidth
            variant={mode === 'spend' ? 'danger' : 'primary'}
            disabled={!beans || parseInt(beans, 10) < 1 || loading}
            onClick={handleConfirm}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'accrue' ? 'Начислить' : 'Списать')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BlockModal({
  open,
  onClose,
  onConfirm,
  mode,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  mode: 'block' | 'unblock';
  loading: boolean;
}) {
  const [comment, setComment] = useState('');
  useEffect(() => { if (!open) setComment(''); }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'block' ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
    >
      <div className="space-y-4">
        {mode === 'block' && (
          <p className="text-sm text-muted">
            Пользователь не сможет войти в аккаунт. Действие записывается в аудит.
          </p>
        )}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Комментарий (необязательно)</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Причина"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button
            fullWidth
            variant={mode === 'block' ? 'danger' : 'primary'}
            disabled={loading}
            onClick={() => onConfirm(comment)}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'block' ? 'Заблокировать' : 'Разблокировать')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit profile ──────────────────────────────────────────────────────────

function EditUserModal({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUserCardOut;
  onSaved: (updated: AdminUserCardOut) => void;
}) {
  const initial = useMemo(() => ({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    middle_name: user.middle_name ?? '',
    birth_date: user.birth_date ?? '',
    email: user.email ?? '',
    country_code: user.country_code ?? '',
  }), [user]);

  const [form, setForm] = useState(initial);
  const [gender, setGender] = useState<Gender | null>(user.gender ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm(initial); setGender(user.gender ?? null); setError(null); }
  }, [open, initial, user.gender]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateUser(user.id, {
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        middle_name: form.middle_name.trim() || null,
        birth_date: form.birth_date || undefined,
        email: form.email.trim() || undefined,
        gender: gender ?? undefined,
        country_code: form.country_code.trim().toUpperCase() || undefined,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать профиль">
      <div className="space-y-4">
        {error && <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'last_name', label: 'Фамилия', type: 'text' },
            { key: 'first_name', label: 'Имя', type: 'text' },
            { key: 'middle_name', label: 'Отчество', type: 'text' },
            { key: 'birth_date', label: 'Дата рождения', type: 'date' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'country_code', label: 'Страна', type: 'text' },
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
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Пол</label>
          <GenderSelect value={gender} onChange={setGender} disabled={saving} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button fullWidth disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Сохранить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Manual coupon issue ───────────────────────────────────────────────────

function IssueCouponModal({
  open,
  onClose,
  userId,
  countryCode,
  onIssued,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  countryCode: string;
  onIssued: (coupon: ApiCoupon) => void;
}) {
  const [items, setItems] = useState<ApiMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [itemId, setItemId] = useState('');
  const [modifiers, setModifiers] = useState<ApiMenuModifier[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearch(''); setItemId(''); setModifiers([]); setSelectedModifiers([]); setError(null);
      return;
    }
    setMenuLoading(true);
    fetchMenu(countryCode)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить меню'))
      .finally(() => setMenuLoading(false));
  }, [open, countryCode]);

  useEffect(() => {
    if (!itemId) { setModifiers([]); setSelectedModifiers([]); return; }
    setSelectedModifiers([]);
    fetchMenuItem(itemId)
      .then((detail) => setModifiers(detail.modifiers))
      .catch(() => setModifiers([]));
  }, [itemId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? items.filter((i) => `${i.name} ${i.size_name}`.toLowerCase().includes(q))
      : items;
    return list.slice(0, 60);
  }, [items, search]);

  const handleIssue = async () => {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const coupon = await adminIssueCoupon(userId, {
        item_id: itemId,
        modifier_ids: selectedModifiers,
      });
      onIssued(coupon);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выдать купон');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Выдать купон вручную">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Купон будет создан без оплаты и без списания Бинов.
        </p>
        {error && <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>}

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Напиток</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию…"
            className="mb-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-surface">
            {menuLoading && <Spinner />}
            {!menuLoading && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">Ничего не найдено</p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setItemId(item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-left text-sm transition-colors last:border-0',
                  itemId === item.id ? 'bg-orange/10 text-orange' : 'hover:bg-surface-el',
                )}
              >
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted">{item.size_name}</span>
              </button>
            ))}
          </div>
        </div>

        {modifiers.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Модификаторы (необязательно)
            </label>
            <div className="flex flex-wrap gap-2">
              {modifiers.map((m) => {
                const active = selectedModifiers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedModifiers((prev) =>
                        active ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                      )
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-border text-muted hover:text-foreground',
                    )}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button fullWidth disabled={!itemId || saving} onClick={handleIssue}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Выдать купон'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Coupon card ───────────────────────────────────────────────────────────

function purchaseKindLabel(coupon: ApiCoupon): string {
  if (coupon.purchase_kind === 'manual') return 'Выдан вручную';
  if (coupon.purchase_kind === 'bean') return `${coupon.price_beans ?? 0} Бинов`;
  return `${coupon.price_money ?? '—'} ${coupon.currency}`;
}

function CouponCard({
  coupon,
  onCancel,
}: {
  coupon: ApiCoupon;
  onCancel: (coupon: ApiCoupon) => void;
}) {
  const drink = coupon.snapshot_items.find((i) => i.kind === 'drink');
  const extras = coupon.snapshot_items.filter((i) => i.kind !== 'drink');

  return (
    <div className="border-b border-border/50 px-5 py-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">
              {drink?.name ?? 'Напиток'}
              {drink?.size_name ? ` · ${drink.size_name}` : ''}
            </span>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
              couponStatusColor(coupon.status),
            )}>
              {couponStatusLabel(coupon.status)}
            </span>
          </div>
          {extras.length > 0 && (
            <p className="mt-0.5 text-xs text-muted truncate">
              {extras.map((e) => e.name).join(', ')}
            </p>
          )}
          <p className="mt-1 font-mono text-xs text-muted">
            № {coupon.number ?? coupon.qr_token}
          </p>
        </div>

        {coupon.status === 'active' && (
          <Button
            variant="secondary"
            onClick={() => onCancel(coupon)}
            className="shrink-0 flex items-center gap-1.5 !px-3 !py-1.5 !text-xs"
          >
            <XCircle size={13} /> Отменить
          </Button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted sm:grid-cols-4">
        <span>Оплата: {purchaseKindLabel(coupon)}</span>
        <span>Куплен: {formatDateTime(coupon.created_at)}</span>
        <span>
          {coupon.used_at
            ? `Использован: ${formatDateTime(coupon.used_at)}`
            : `Действует до: ${formatDateTime(coupon.expires_at)}`}
        </span>
        {coupon.reserved_at && <span>Резерв: {formatDateTime(coupon.reserved_at)}</span>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminUserPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const router = useRouter();

  const [user, setUser] = useState<AdminUserCardOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('profile');

  const [coupons, setCoupons] = useState<ApiCoupon[] | null>(null);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [transactions, setTransactions] = useState<ApiLoyaltyTransaction[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [events, setEvents] = useState<AuthEventOut[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [beanOpMode, setBeanOpMode] = useState<'accrue' | 'spend' | null>(null);
  const [beanLoading, setBeanLoading] = useState(false);
  const [blockMode, setBlockMode] = useState<'block' | 'unblock' | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ApiCoupon | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelComment, setCancelComment] = useState('');

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await adminGetUser(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const page = await adminGetUserCoupons(userId, { limit: 100 });
      setCoupons(page.items);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка загрузки купонов', false);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  }, [userId]);

  // Данные вкладок подгружаются по первому открытию.
  useEffect(() => {
    if (tab === 'coupons' && coupons === null && !couponsLoading) void loadCoupons();
    if (tab === 'beans' && transactions === null && !txLoading) {
      setTxLoading(true);
      adminGetUserTransactions(userId, { limit: 100 })
        .then((page) => setTransactions(page.items))
        .catch(() => setTransactions([]))
        .finally(() => setTxLoading(false));
    }
    if (tab === 'events' && events === null && !eventsLoading) {
      setEventsLoading(true);
      adminGetUserAuthEvents(userId, 50)
        .then(setEvents)
        .catch(() => setEvents([]))
        .finally(() => setEventsLoading(false));
    }
  }, [tab, userId, coupons, couponsLoading, transactions, txLoading, events, eventsLoading, loadCoupons]);

  const handleBeanOp = async (beans: number, comment: string) => {
    if (!beanOpMode) return;
    setBeanLoading(true);
    try {
      const res = beanOpMode === 'accrue'
        ? await adminAccrueBeans(userId, beans, comment || undefined)
        : await adminSpendBeans(userId, beans, comment || undefined);
      setUser((prev) => prev ? { ...prev, balance: res.balance } : prev);
      setTransactions(null);
      setBeanOpMode(null);
      showToast(beanOpMode === 'accrue' ? `+${beans} Бинов начислено` : `−${beans} Бинов списано`, true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    } finally {
      setBeanLoading(false);
    }
  };

  const handleBlockOp = async (comment: string) => {
    if (!blockMode) return;
    setBlockLoading(true);
    try {
      if (blockMode === 'block') await adminBlockUser(userId, comment || undefined);
      else await adminUnblockUser(userId, comment || undefined);
      setUser((prev) => prev ? { ...prev, is_blocked: blockMode === 'block' } : prev);
      setBlockMode(null);
      showToast(blockMode === 'block' ? 'Пользователь заблокирован' : 'Блокировка снята', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleCancelCoupon = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await adminCancelCoupon(cancelTarget.id, cancelComment || undefined);
      setCoupons((prev) =>
        prev?.map((c) => (c.id === cancelTarget.id ? { ...c, status: 'refunded' as const } : c)) ?? prev,
      );
      setUser((prev) => prev && prev.active_coupons > 0
        ? { ...prev, active_coupons: prev.active_coupons - 1 }
        : prev);
      setCancelTarget(null);
      setCancelComment('');
      showToast('Купон отменён', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка отмены', false);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Назад
        </button>
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error ?? 'Пользователь не найден'}
        </div>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name, user.middle_name]
    .filter(Boolean).join(' ') || 'Без имени';

  return (
    <>
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all',
          toast.ok ? 'bg-green-500 text-white' : 'bg-danger text-white',
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="p-8 max-w-4xl space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> К списку пользователей
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
              user.is_blocked ? 'bg-danger/10 text-danger' : 'bg-orange/10 text-orange',
            )}>
              {user.is_blocked ? <ShieldBan size={24} /> : <User size={24} />}
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{fullName}</h1>
              <p className="text-sm text-muted">{user.phone}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {user.is_blocked && (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                    Заблокирован
                  </span>
                )}
                {!user.profile_completed && (
                  <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                    Неполный профиль
                  </span>
                )}
                {!user.is_active && (
                  <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-muted">
                    Неактивен
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2"
            >
              <Pencil size={16} /> Редактировать
            </Button>
            <Button
              variant={user.is_blocked ? 'secondary' : 'danger'}
              onClick={() => setBlockMode(user.is_blocked ? 'unblock' : 'block')}
              className="flex items-center gap-2"
            >
              {user.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
              {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
            </Button>
          </div>
        </div>

        {/* Кликабельные ячейки: баланс → операции с Бинами, купоны → список */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setBeanOpMode('accrue')}
            className="group rounded-xl border border-border bg-surface p-4 text-center transition-colors hover:border-orange/40 hover:bg-orange/5"
          >
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-orange tabular-nums">
              {new Intl.NumberFormat('ru-RU').format(user.balance)}
              <CoffeeBeanIcon size={18} className="shrink-0" />
            </div>
            <p className="text-xs text-muted mt-1">Баланс Бинов</p>
            <div className="mt-2 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">
                <PlusCircle size={9} /> Начислить
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                <MinusCircle size={9} /> Списать
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab('coupons')}
            className="group rounded-xl border border-border bg-surface p-4 text-center transition-colors hover:border-orange/40 hover:bg-orange/5"
          >
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground tabular-nums">
              <Ticket size={20} className="shrink-0 text-orange" />
              {user.active_coupons}
            </div>
            <p className="text-xs text-muted mt-1">Активных купонов</p>
            <div className="mt-2 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-medium text-orange">
                Открыть купоны
              </span>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-surface-ov p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                tab === t.id ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Профиль */}
        {tab === 'profile' && (
          <div className="grid grid-cols-2 gap-2">
            <InfoChip icon={Hash} label="Код" value={user.code} />
            <InfoChip icon={Globe} label="Страна" value={user.country_code.toUpperCase()} />
            <InfoChip icon={Phone} label="Телефон" value={user.phone} />
            <InfoChip icon={Mail} label="Email" value={user.email || '—'} />
            <InfoChip
              icon={Calendar}
              label="Дата рождения"
              value={user.birth_date ? new Date(user.birth_date).toLocaleDateString('ru-RU') : '—'}
            />
            <InfoChip
              icon={Users2}
              label="Пол"
              value={user.gender ? GENDER_LABELS[user.gender] : '—'}
            />
            <InfoChip icon={CreditCard} label="ID" value={`${user.id.slice(0, 8)}…`} />
          </div>
        )}

        {/* Купоны */}
        {tab === 'coupons' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted">
                {coupons ? `Всего купонов: ${coupons.length}` : ' '}
              </p>
              <Button onClick={() => setShowIssue(true)} className="flex items-center gap-2">
                <GiftIcon size={16} /> Выдать купон
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {couponsLoading && <Spinner />}
              {!couponsLoading && coupons?.length === 0 && <Empty text="Купонов нет" />}
              {!couponsLoading && coupons?.map((c) => (
                <CouponCard key={c.id} coupon={c} onCancel={setCancelTarget} />
              ))}
            </div>
          </div>
        )}

        {/* История Бинов */}
        {tab === 'beans' && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {txLoading && <Spinner />}
            {!txLoading && transactions?.length === 0 && <Empty text="Операций нет" />}
            {!txLoading && transactions?.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{transactionLabel(tx.type)}</p>
                  {tx.comment && <p className="text-xs text-muted truncate">{tx.comment}</p>}
                  <p className="text-[11px] text-muted">
                    {formatDateTime(tx.created_at)}
                    {tx.correlation_id && ` · ${tx.correlation_id}`}
                  </p>
                </div>
                <span className={cn(
                  'flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums',
                  isCredit(tx.amount) ? 'text-green-500' : 'text-muted',
                )}>
                  {formatSignedBeans(tx.amount)}
                  <CoffeeBeanIcon size={12} />
                </span>
              </div>
            ))}
          </div>
        )}

        {/* События входа */}
        {tab === 'events' && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {eventsLoading && <Spinner />}
            {!eventsLoading && events?.length === 0 && <Empty text="Событий нет" />}
            {!eventsLoading && events?.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-4 border-b border-border/50 px-5 py-3 last:border-0"
              >
                <Clock size={14} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium capitalize">{ev.event}</span>
                    {ev.ip && <span className="font-mono text-[10px] text-muted">{ev.ip}</span>}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted">{formatDateTime(ev.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BeanOpModal
        open={beanOpMode !== null}
        onClose={() => setBeanOpMode(null)}
        onConfirm={handleBeanOp}
        mode={beanOpMode ?? 'accrue'}
        setMode={(m) => setBeanOpMode(m)}
        loading={beanLoading}
      />

      <BlockModal
        open={blockMode !== null}
        onClose={() => setBlockMode(null)}
        onConfirm={handleBlockOp}
        mode={blockMode ?? 'block'}
        loading={blockLoading}
      />

      <EditUserModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        user={user}
        onSaved={(updated) => { setUser(updated); showToast('Профиль обновлён', true); }}
      />

      <IssueCouponModal
        open={showIssue}
        onClose={() => setShowIssue(false)}
        userId={userId}
        countryCode={user.country_code}
        onIssued={(coupon) => {
          setCoupons((prev) => (prev ? [coupon, ...prev] : [coupon]));
          setUser((prev) => prev ? { ...prev, active_coupons: prev.active_coupons + 1 } : prev);
          showToast('Купон выдан', true);
        }}
      />

      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Отменить купон"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Купон {cancelTarget?.number ?? ''} будет отменён, Бины или деньги вернутся
            пользователю согласно правилам программы.
          </p>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">
              Причина (необязательно)
            </label>
            <input
              type="text"
              value={cancelComment}
              onChange={(e) => setCancelComment(e.target.value)}
              placeholder="Причина отмены"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setCancelTarget(null)}>
              Закрыть
            </Button>
            <Button variant="danger" fullWidth disabled={cancelLoading} onClick={handleCancelCoupon}>
              {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : 'Отменить купон'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

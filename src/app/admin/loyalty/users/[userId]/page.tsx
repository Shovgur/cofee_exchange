'use client';

import { useCallback, useEffect, useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import {
  adminGetUser,
  adminGetUserAuthEvents,
  adminAccrueBeans,
  adminSpendBeans,
  adminBlockUser,
  adminUnblockUser,
  adminCancelCoupon,
  type AdminUserCardOut,
  type AuthEventOut,
} from '@/lib/api/loyalty/admin';
import { cn, formatDateTime } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CoffeeBeanIcon from '@/components/ui/CoffeeBeanIcon';

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

  const handleConfirm = () => {
    const n = parseInt(beans, 10);
    if (!n || n < 1) return;
    onConfirm(n, comment);
  };

  useEffect(() => {
    if (!open) { setBeans(''); setComment(''); }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Операции с Бинами">
      <div className="space-y-4">
        {/* Переключатель начислить/списать */}
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
          <label className="block text-xs font-medium text-muted mb-1.5">
            Количество Бинов
          </label>
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
          <label className="block text-xs font-medium text-muted mb-1.5">
            Комментарий (необязательно)
          </label>
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
          <label className="block text-xs font-medium text-muted mb-1.5">
            Комментарий (необязательно)
          </label>
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

function CancelCouponModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (couponId: string, comment: string) => void;
  loading: boolean;
}) {
  const [couponId, setCouponId] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => { if (!open) { setCouponId(''); setComment(''); } }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Отменить купон">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Активный купон будет отменён, Бины или деньги вернутся пользователю согласно правилам программы.
        </p>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">ID купона</label>
          <input
            type="text"
            value={couponId}
            onChange={(e) => setCouponId(e.target.value.trim())}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Причина (необязательно)</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Причина отмены"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Отмена</Button>
          <Button
            variant="danger"
            fullWidth
            disabled={!couponId || loading}
            onClick={() => onConfirm(couponId, comment)}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Отменить купон'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminUserPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const router = useRouter();

  const [user, setUser] = useState<AdminUserCardOut | null>(null);
  const [events, setEvents] = useState<AuthEventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);

  const [beanOpMode, setBeanOpMode] = useState<'accrue' | 'spend' | null>(null);
  const [beanLoading, setBeanLoading] = useState(false);

  const [blockMode, setBlockMode] = useState<'block' | 'unblock' | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);

  const [showCancelCoupon, setShowCancelCoupon] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, ev] = await Promise.all([
        adminGetUser(userId),
        adminGetUserAuthEvents(userId, 20),
      ]);
      setUser(u);
      setEvents(ev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const handleBeanOp = async (beans: number, comment: string) => {
    if (!beanOpMode) return;
    setBeanLoading(true);
    try {
      const res = beanOpMode === 'accrue'
        ? await adminAccrueBeans(userId, beans, comment || undefined)
        : await adminSpendBeans(userId, beans, comment || undefined);
      setUser((prev) => prev ? { ...prev, balance: res.balance } : prev);
      setBeanOpMode(null);
      showToast(beanOpMode === 'accrue' ? `+${beans} Бинов начислено` : `-${beans} Бинов списано`, true);
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
      blockMode === 'block'
        ? await adminBlockUser(userId, comment || undefined)
        : await adminUnblockUser(userId, comment || undefined);
      setUser((prev) => prev ? { ...prev, is_blocked: blockMode === 'block' } : prev);
      setBlockMode(null);
      showToast(blockMode === 'block' ? 'Пользователь заблокирован' : 'Блокировка снята', true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка', false);
    } finally {
      setBlockLoading(false);
    }
  };

  const handleCancelCoupon = async (couponId: string, comment: string) => {
    setCancelLoading(true);
    try {
      await adminCancelCoupon(couponId, comment || undefined);
      setUser((prev) => prev && prev.active_coupons > 0
        ? { ...prev, active_coupons: prev.active_coupons - 1 }
        : prev);
      setShowCancelCoupon(false);
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
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all',
          toast.ok ? 'bg-green-500 text-white' : 'bg-danger text-white',
        )}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="p-8 max-w-3xl space-y-6">
        {/* Back */}
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

          {/* Block/Unblock */}
          <Button
            variant={user.is_blocked ? 'secondary' : 'danger'}
            onClick={() => setBlockMode(user.is_blocked ? 'unblock' : 'block')}
            className="flex items-center gap-2"
          >
            {user.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
            {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
          </Button>
        </div>

        {/* Stats — ячейки кликабельные */}
        <div className="grid grid-cols-2 gap-3">
          {/* Баланс → открывает начислить/списать */}
          <button
            type="button"
            onClick={() => setBeanOpMode('accrue')}
            className="group rounded-xl border border-border bg-surface p-4 text-center hover:border-orange/40 hover:bg-orange/5 transition-colors relative"
          >
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-orange tabular-nums">
              {new Intl.NumberFormat('ru-RU').format(user.balance)}
              <CoffeeBeanIcon size={18} className="shrink-0" />
            </div>
            <p className="text-xs text-muted mt-1">Баланс Бинов</p>
            <div className="mt-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">
                <PlusCircle size={9} /> Начислить
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                <MinusCircle size={9} /> Списать
              </span>
            </div>
          </button>

          {/* Купоны → открывает отмену */}
          <button
            type="button"
            onClick={() => user.active_coupons > 0 && setShowCancelCoupon(true)}
            disabled={user.active_coupons === 0}
            className="group rounded-xl border border-border bg-surface p-4 text-center hover:border-danger/40 hover:bg-danger/5 transition-colors disabled:opacity-60 disabled:cursor-default disabled:hover:border-border disabled:hover:bg-surface"
          >
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-foreground tabular-nums">
              <Ticket size={20} className="text-orange shrink-0" />
              {user.active_coupons}
            </div>
            <p className="text-xs text-muted mt-1">Активных купонов</p>
            {user.active_coupons > 0 && (
              <div className="mt-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
                  <XCircle size={9} /> Отменить купон
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Profile details */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Профиль</h2>
          <div className="grid grid-cols-2 gap-2">
            <InfoChip icon={Hash} label="Код" value={user.code} />
            <InfoChip icon={Globe} label="Страна" value={user.country_code.toUpperCase()} />
            {user.email && <InfoChip icon={Mail} label="Email" value={user.email} />}
            {user.birth_date && (
              <InfoChip
                icon={Calendar}
                label="Дата рождения"
                value={new Date(user.birth_date).toLocaleDateString('ru-RU')}
              />
            )}
            <InfoChip icon={Phone} label="Телефон" value={user.phone} />
            <InfoChip icon={CreditCard} label="ID" value={user.id.slice(0, 8) + '…'} />
          </div>
        </div>

        {/* Auth events */}
        <div>
          <button
            type="button"
            onClick={() => setShowEvents((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-el transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock size={16} className="text-muted" />
              События входа
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-muted">
                {events.length}
              </span>
            </div>
            {showEvents ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
          </button>

          {showEvents && events.length > 0 && (
            <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-4 px-4 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize">{ev.event}</span>
                      {ev.ip && <span className="text-[10px] text-muted font-mono">{ev.ip}</span>}
                    </div>
                    <p className="text-[10px] text-muted mt-0.5">{formatDateTime(ev.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bean operation modal */}
      <BeanOpModal
        open={beanOpMode !== null}
        onClose={() => setBeanOpMode(null)}
        onConfirm={handleBeanOp}
        mode={beanOpMode ?? 'accrue'}
        setMode={(m) => setBeanOpMode(m)}
        loading={beanLoading}
      />

      {/* Block modal */}
      <BlockModal
        open={blockMode !== null}
        onClose={() => setBlockMode(null)}
        onConfirm={handleBlockOp}
        mode={blockMode ?? 'block'}
        loading={blockLoading}
      />

      {/* Cancel coupon modal */}
      <CancelCouponModal
        open={showCancelCoupon}
        onClose={() => setShowCancelCoupon(false)}
        onConfirm={handleCancelCoupon}
        loading={cancelLoading}
      />
    </>
  );
}

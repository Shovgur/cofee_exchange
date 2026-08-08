'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Phone,
  Hash,
  Globe,
  ShieldBan,
  ChevronRight,
  Users,
  UserPlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  adminSearchUsers,
  adminCreateUser,
  type AdminUserOut,
} from '@/lib/api/loyalty/admin';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import GenderSelect, { type Gender } from '@/components/ui/GenderSelect';

const PAGE_SIZE = 50;

function UserRow({ user, onClick }: { user: AdminUserOut; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-el transition-colors text-left border-b border-border/50 last:border-0"
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        user.is_blocked ? 'bg-danger/10 text-danger' : 'bg-orange/10 text-orange',
      )}>
        {user.is_blocked ? <ShieldBan size={18} /> : <User size={18} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Без имени'}
          </span>
          {user.is_blocked && (
            <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">
              Заблокирован
            </span>
          )}
          {!user.profile_completed && (
            <span className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
              Неполный профиль
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted flex items-center gap-1">
            <Phone size={10} />
            {user.phone}
          </span>
          <span className="text-xs text-muted flex items-center gap-1">
            <Hash size={10} />
            {user.code}
          </span>
          <span className="text-xs text-muted flex items-center gap-1">
            <Globe size={10} />
            {user.country_code.toUpperCase()}
          </span>
        </div>
      </div>

      <ChevronRight size={16} className="shrink-0 text-muted" />
    </button>
  );
}

const EMPTY_FORM = {
  phone: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  birth_date: '',
  email: '',
  country_code: 'RU',
};

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (userId: string) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); setGender(null); setError(null); }
  }, [open]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async () => {
    const phone = form.phone.trim();
    if (!phone) return;
    setSaving(true);
    setError(null);
    try {
      const created = await adminCreateUser({
        phone,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        middle_name: form.middle_name.trim() || undefined,
        birth_date: form.birth_date || undefined,
        email: form.email.trim() || undefined,
        gender: gender ?? undefined,
        country_code: form.country_code.trim().toUpperCase() || undefined,
      });
      onCreated(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать пользователя');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Новый пользователь">
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
        )}

        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">
            Телефон <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+79990001122"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <p className="mt-1 text-[11px] text-muted">
            Код пользователя генерируется автоматически.
          </p>
        </div>

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
          <Button fullWidth disabled={!form.phone.trim() || saving} onClick={handleCreate}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminLoyaltyPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserOut[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Отбрасываем ответы устаревших запросов, чтобы список не «прыгал» при быстром вводе.
  const requestId = useRef(0);

  const load = useCallback(async (q: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await adminSearchUsers({ query: q.trim() || undefined, limit: PAGE_SIZE });
      if (id !== requestId.current) return;
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      setUsers([]);
      setTotal(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(query), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await adminSearchUsers({
        query: query.trim() || undefined,
        limit: PAGE_SIZE,
        offset: users.length,
      });
      setUsers((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = total !== null && users.length < total;

  return (
    <div className="p-8 max-w-3xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Пользователи</h1>
          <p className="text-sm text-muted">Поиск по телефону, коду, имени или email</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
            <Users size={16} className="text-orange" />
            <span className="text-sm font-bold tabular-nums">
              {total === null ? '—' : total}
            </span>
            <span className="text-xs text-muted">{query.trim() ? 'найдено' : 'всего'}</span>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <UserPlus size={16} />
            Добавить
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="+7 900 000 00 00, код, имя, email…"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-orange/40"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && users.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-muted" />
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Search size={40} strokeWidth={1.2} />
          <p className="text-sm">
            {query.trim() ? 'Пользователи не найдены' : 'Пользователей пока нет'}
          </p>
        </div>
      )}

      {users.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-3">
            Показано {users.length} из {total}
          </p>
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onClick={() => router.push(`/admin/loyalty/users/${u.id}`)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Показать ещё'}
              </Button>
            </div>
          )}
        </div>
      )}

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(userId) => {
          setShowCreate(false);
          setToast('Пользователь создан');
          setTimeout(() => setToast(null), 3000);
          router.push(`/admin/loyalty/users/${userId}`);
        }}
      />
    </div>
  );
}

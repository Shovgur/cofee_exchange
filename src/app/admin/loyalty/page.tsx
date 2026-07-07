'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Phone, Hash, Globe, ShieldBan, CheckCircle2, ChevronRight, Users } from 'lucide-react';
import { adminSearchUsers, type AdminUserOut } from '@/lib/api/loyalty/admin';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';


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

export default function AdminLoyaltyPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserOut[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminSearchUsers({ query: q.trim(), limit: 50 });
      setUsers(res.items);
      setTotal(res.total);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка поиска');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    if (!v.trim()) {
      setUsers([]);
      setTotal(null);
      setSearched(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Пользователи</h1>
          <p className="text-sm text-muted">Поиск по телефону, коду, имени или email</p>
        </div>
        {total !== null && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 shrink-0">
            <Users size={16} className="text-orange" />
            <span className="text-sm font-bold tabular-nums">{total}</span>
            <span className="text-xs text-muted">найдено</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
            placeholder="+7 900 000 00 00, код, имя, email…"
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
        </div>
        <Button onClick={() => doSearch(query)} disabled={!query.trim()} loading={loading}>
          {!loading && 'Найти'}
        </Button>
      </div>

      {/* Results */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger mb-4">
          {error}
        </div>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <Search size={40} strokeWidth={1.2} />
          <p className="text-sm">Введите запрос для поиска пользователей</p>
        </div>
      )}

      {searched && users.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <CheckCircle2 size={40} strokeWidth={1.2} />
          <p className="text-sm">Пользователи не найдены</p>
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
        </div>
      )}
    </div>
  );
}

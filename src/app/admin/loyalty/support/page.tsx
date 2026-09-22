'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Loader2, Search } from 'lucide-react';
import {
  adminListSupportTickets,
  type SupportTicketListItem,
  type SupportTicketStatus,
} from '@/lib/api/loyalty/support';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Открыто',
  in_progress: 'В работе',
  answered: 'Отвечено',
  closed: 'Закрыто',
};

export default function AdminSupportPage() {
  const [items, setItems] = useState<SupportTicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<SupportTicketStatus | ''>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await adminListSupportTickets({
        status: status || undefined,
        query,
        limit: 50,
      });
      setItems(page.items);
      setTotal(page.total);
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="text-orange" />
        Обратная связь
      </h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['', 'open', 'in_progress', 'answered', 'closed'] as const).map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              status === s ? 'border-orange bg-orange/10 text-orange' : 'border-border text-muted',
            )}
          >
            {s ? STATUS_LABEL[s] : 'Все'}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск…"
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      <p className="text-xs text-muted mb-3">Всего: {total}</p>

      {loading ? (
        <Loader2 className="mx-auto animate-spin text-muted" />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/admin/loyalty/support/${t.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 hover:border-orange/40"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted">
                  {t.user_phone} · {t.category} · {STATUS_LABEL[t.status]}
                </p>
              </div>
              {t.unread_from_user > 0 && (
                <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold text-white">
                  {t.unread_from_user}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

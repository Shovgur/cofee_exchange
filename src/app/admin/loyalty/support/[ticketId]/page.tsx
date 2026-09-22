'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  adminGetSupportTicket,
  adminReplySupportTicket,
  adminPatchSupportTicket,
  type SupportTicketDetail,
} from '@/lib/api/loyalty/support';

export default function AdminSupportTicketPage({ params }: { params: { ticketId: string } }) {
  const { ticketId } = params;
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTicket(await adminGetSupportTicket(ticketId));
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      setTicket(await adminReplySupportTicket(ticketId, { body: reply.trim() }));
      setReply('');
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    setTicket(await adminPatchSupportTicket(ticketId, { status: 'closed' }));
  };

  if (loading || !ticket) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl flex flex-col min-h-[70vh]">
      <button
        type="button"
        onClick={() => router.push('/admin/loyalty/support')}
        className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> К списку
      </button>

      <h1 className="text-xl font-bold mb-1">{ticket.subject}</h1>
      <p className="text-sm text-muted mb-6">
        {ticket.user_phone} · {ticket.user_name ?? '—'} · {ticket.status}
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto mb-4 rounded-2xl border border-border bg-surface p-4">
        {ticket.messages.map((m) => (
          <div
            key={m.id}
            className={m.author_type === 'admin' ? 'ml-8 rounded-xl bg-orange/10 px-3 py-2' : 'mr-8 rounded-xl bg-surface-el px-3 py-2'}
          >
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
            <p className="text-[10px] text-muted mt-1">{new Date(m.created_at).toLocaleString('ru-RU')}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            placeholder="Ответ пользователю (уйдёт в ленту и push)…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm mb-3"
          />
          <div className="flex gap-2">
            <Button onClick={send} disabled={sending || !reply.trim()} className="flex items-center gap-2">
              <Send size={16} /> Отправить
            </Button>
            <Button variant="secondary" onClick={closeTicket}>Закрыть обращение</Button>
          </div>
        </>
      )}
    </div>
  );
}

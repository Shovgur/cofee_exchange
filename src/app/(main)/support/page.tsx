'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createSupportTicket } from '@/lib/api/loyalty/support';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-6 text-center text-muted">
        Войдите в аккаунт, чтобы написать в поддержку.
      </div>
    );
  }

  const submit = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await createSupportTicket({ subject: subject.trim(), body: body.trim(), category: 'question' });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6 pb-24">
      <h1 className="text-xl font-bold mb-2 flex items-center gap-2">
        <MessageSquare size={20} className="text-orange" />
        Поддержка
      </h1>
      <p className="text-sm text-muted mb-6">
        Опишите вопрос или проблему — ответ придёт в уведомлениях.
      </p>

      {done ? (
        <div className="rounded-2xl border border-success/30 bg-success/5 p-4 text-sm">
          Обращение отправлено. Спасибо!
          <Button variant="secondary" fullWidth className="mt-4" onClick={() => router.push('/profile')}>
            В профиль
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Тема"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Сообщение"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button fullWidth onClick={submit} loading={sending} disabled={!subject.trim() || !body.trim()}>
            Отправить
          </Button>
        </div>
      )}
    </div>
  );
}

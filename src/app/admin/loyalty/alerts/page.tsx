'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { adminGetAlerts, type SecurityAlertOut } from '@/lib/api/loyalty/admin';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

const ALERT_COLORS: Record<string, string> = {
  fraud: 'bg-danger/10 text-danger',
  suspicious: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

function AlertRow({ alert }: { alert: SecurityAlertOut }) {
  const colorClass = ALERT_COLORS[alert.alert_type] ?? 'bg-orange/10 text-orange';

  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-border/50 last:border-0">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', colorClass)}>
        <AlertTriangle size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', colorClass)}>
            {alert.alert_type}
          </span>
          <span className="text-sm font-medium truncate">{alert.subject}</span>
        </div>
        <p className="text-xs text-muted mt-0.5">
          {alert.subject_type} · количество: {alert.count}
        </p>
      </div>
      <p className="shrink-0 text-[10px] text-muted">{fmt(alert.created_at)}</p>
    </div>
  );
}

export default function AdminLoyaltyAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlertOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetAlerts(100);
      setAlerts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <ShieldAlert size={22} className="text-orange" />
            Алерты антифрода
          </h1>
          <p className="text-sm text-muted">Последние подозрительные события</p>
        </div>
        <Button variant="secondary" onClick={load} loading={loading}>
          {!loading && <RefreshCw size={14} />}
          Обновить
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-muted" />
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted">
          <ShieldAlert size={40} strokeWidth={1.2} />
          <p className="text-sm">Алертов нет — всё чисто</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-3">{alerts.length} алертов</p>
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {alerts.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

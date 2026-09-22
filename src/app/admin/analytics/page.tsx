'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { adminStatsOverview, adminStatsTopDrinks, type StatsOverview } from '@/lib/api/loyalty/stats';
import { downloadAdminExport } from '@/lib/api/loyalty/exports';

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [top, setTop] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [o, drinks] = await Promise.all([
          adminStatsOverview(),
          adminStatsTopDrinks({ limit: 5 }),
        ]);
        setOverview(o);
        setTop(drinks.map((d) => ({ name: `${d.name} ${d.size_id}`, count: d.count })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-orange" />
          Статистика
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadAdminExport('users')} className="flex items-center gap-2">
            <Download size={14} /> Excel: пользователи
          </Button>
          <Button variant="secondary" onClick={() => downloadAdminExport('coupons')} className="flex items-center gap-2">
            <Download size={14} /> Excel: купоны
          </Button>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Пользователей" value={String(overview.users_total)} />
          <StatCard label="Новых за период" value={String(overview.users_new)} />
          <StatCard label="Чеков" value={String(overview.receipts_count)} />
          <StatCard label="Выручка" value={`${overview.revenue} ₽`} />
          <StatCard label="Купонов выдано" value={String(overview.coupons_issued)} />
          <StatCard label="Купонов погашено" value={String(overview.coupons_used)} />
          <StatCard label="Бинов начислено" value={String(overview.beans_accrued)} />
          <StatCard label="Бинов списано" value={overview.beans_spent != null ? String(overview.beans_spent) : '—'} />
        </div>
      )}

      {top.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Топ напитков (купоны)</h2>
          <ul className="space-y-2 text-sm">
            {top.map((row, i) => (
              <li key={i} className="flex justify-between">
                <span>{row.name}</span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

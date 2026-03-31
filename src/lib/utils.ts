import { clsx, type ClassValue } from 'clsx';
import type { DrinkCategory, FeedItemType, PriceTrend } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number, symbol: string): string {
  return `${Math.round(price)} ${symbol}`;
}

export function formatPriceChange(change: number): string {
  if (change === 0) return '0%';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffD === 1) return 'вчера';
  if (diffD < 7) return `${diffD} дн назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function trendColor(trend: PriceTrend): string {
  if (trend === 'up') return 'text-success';
  if (trend === 'down') return 'text-danger';
  return 'text-muted';
}

export function trendBg(trend: PriceTrend): string {
  if (trend === 'up') return 'bg-success/10 text-success';
  if (trend === 'down') return 'bg-danger/10 text-danger';
  return 'bg-white/5 text-muted';
}

export function categoryLabel(cat: DrinkCategory): string {
  const map: Record<DrinkCategory, string> = {
    coffee: 'Кофе',
    lemonade: 'Лимонады',
    tea: 'Чаи',
  };
  return map[cat] ?? cat;
}

export function feedTypeLabel(type: FeedItemType): string {
  const map: Record<FeedItemType, string> = {
    news: 'Новости',
    promotion: 'Акции',
    event: 'События',
    new_drink: 'Новинка',
    ipo: 'IPO напитков',
  };
  return map[type] ?? type;
}

export function feedTypeColor(type: FeedItemType): string {
  const map: Record<FeedItemType, string> = {
    news: 'bg-blue-500/20 text-blue-400',
    promotion: 'bg-orange/20 text-orange',
    event: 'bg-purple-500/20 text-purple-400',
    new_drink: 'bg-success/20 text-success',
    ipo: 'bg-yellow-500/20 text-yellow-400',
  };
  return map[type] ?? '';
}

/** Рассчитывает время до следующего обновления цен.
 *  intervalMinutes — интервал обновления в минутах (по умолчанию 5). */
export function getNextPriceUpdateAt(intervalMinutes = 5): number {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  return Math.ceil(now / intervalMs) * intervalMs;
}

/** Форматирует оставшееся время в мм:сс */
export function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Форматирует обратный отсчёт до даты как «Xд Yч Zм» или «мм:сс» если < 1 часа */
export function formatIpoCountdown(isoDate: string): string {
  const diff = Math.max(0, new Date(isoDate).getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (days > 0) return `${days}д ${hours}ч ${mins}м`;
  if (hours > 0) return `${hours}ч ${mins}м ${secs}с`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function couponStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Активен',
    used: 'Использован',
    expired: 'Просрочен',
    cancelled: 'Отменён',
  };
  return map[status] ?? status;
}

export function couponStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-success/20 text-success',
    used: 'bg-muted/20 text-muted',
    expired: 'bg-danger/20 text-danger',
    cancelled: 'bg-danger/10 text-danger/70',
  };
  return map[status] ?? '';
}

export function formatChartTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1)} км`;
}

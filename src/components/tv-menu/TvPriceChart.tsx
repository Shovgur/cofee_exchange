'use client';

import { useId } from 'react';
import type { PricePoint } from '@/types';

const VIEW_W = 100;
const VIEW_H = 100;
const GRID_LINES = 4;

interface Point {
  x: number;
  y: number;
}

/** Сглаживание кривой через Catmull-Rom: линия выглядит как в приложении. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  const d = [`M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d.push(
      `C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
    );
  }

  return d.join(' ');
}

/**
 * График цены для ТВ-меню: заливка градиентом и линия акцентным цветом —
 * тот же вид, что на карточке напитка в приложении. Растягивается по размеру
 * секции, толщина линии при этом не плывёт.
 */
export default function TvPriceChart({
  points,
  color,
  className,
  strokeWidth = 3,
}: {
  points: PricePoint[];
  color: string;
  className?: string;
  strokeWidth?: number;
}) {
  const gradientId = `tv-price-grad-${useId().replace(/:/g, '')}`;

  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  // Небольшие поля сверху и снизу, иначе пики упираются в границы секции.
  const span = (max - min || 1) * 1.25;
  const mid = (max + min) / 2;
  const low = mid - span / 2;

  const step = VIEW_W / (points.length - 1);
  const coords: Point[] = prices.map((price, i) => ({
    x: i * step,
    y: VIEW_H - ((price - low) / span) * VIEW_H,
  }));

  const line = smoothPath(coords);
  const area = `${line} L ${VIEW_W},${VIEW_H} L 0,${VIEW_H} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {Array.from({ length: GRID_LINES }).map((_, i) => {
        const y = ((i + 1) * VIEW_H) / (GRID_LINES + 1);
        return (
          <line
            key={i}
            x1={0}
            x2={VIEW_W}
            y1={y}
            y2={y}
            stroke="var(--tv-border)"
            strokeWidth={1}
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

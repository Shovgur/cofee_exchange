'use client';

import type { PricePoint } from '@/types';

/** Компактный график цены: только форма кривой, без осей и подписей. */
export default function Sparkline({
  points,
  color,
  className,
  width = 120,
  height = 32,
}: {
  points: PricePoint[];
  color: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const step = width / (points.length - 1);
  const coords = prices.map((price, i) => {
    const x = i * step;
    // Инвертируем ось Y: в SVG ноль сверху.
    const y = height - ((price - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${coords.join(' L ')}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path d={area} fill={color} opacity={0.14} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

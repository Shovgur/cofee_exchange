'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Brush,
  ReferenceLine,
} from 'recharts';
import { formatChartTime } from '@/lib/utils';
import type { PricePoint } from '@/types';

interface Props {
  data: PricePoint[];
  currencySymbol: string;
  basePrice: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: PricePoint; unit?: string }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as PricePoint;
  return (
    <div className="bg-surface-el border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-muted mb-0.5">{formatChartTime(point.timestamp)}</div>
      <div className="font-semibold text-white text-sm">
        {Math.round(point.price)} {payload[0].unit}
      </div>
    </div>
  );
}

export default function PriceChart({ data, currencySymbol, basePrice }: Props) {
  const prices = data.map((d) => d.price);
  const minY = Math.min(...prices) * 0.97;
  const maxY = Math.max(...prices) * 1.03;

  const chartData = data.map((d) => ({
    ...d,
    price: Math.round(d.price * 100) / 100,
  }));

  // Sample every 6th point for x-axis labels (every 3 hours)
  const tickIndices = new Set(
    chartData
      .map((_, i) => i)
      .filter((i) => i % 6 === 0),
  );

  return (
    <div className="w-full select-none">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2E2E2E"
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={(v, i) =>
              tickIndices.has(
                chartData.findIndex((d) => d.timestamp === v),
              )
                ? formatChartTime(v)
                : ''
            }
            tick={{ fill: '#888888', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStart"
          />

          <YAxis
            domain={[minY, maxY]}
            tick={{ fill: '#888888', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => String(Math.round(v))}
          />

          <ReferenceLine
            y={basePrice}
            stroke="#2E2E2E"
            strokeDasharray="4 4"
            label={{ value: 'base', fill: '#555', fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="price"
            stroke="#FF6B35"
            strokeWidth={2}
            fill="url(#priceGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#FF6B35', stroke: '#0E0E0E', strokeWidth: 2 }}
            unit={currencySymbol}
          />

          <Brush
            dataKey="timestamp"
            height={20}
            stroke="#2E2E2E"
            fill="#1A1A1A"
            travellerWidth={6}
            tickFormatter={() => ''}
            startIndex={Math.floor(chartData.length * 0.5)}
            endIndex={chartData.length - 1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

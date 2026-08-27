'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Type, GlassWater, LineChart } from 'lucide-react';
import {
  GRID_COLUMNS,
  GRID_ROWS,
  type TvGridRect,
  type TvMenuSection,
  type TvOrientation,
} from '@/lib/tv-menu/config';
import { cn } from '@/lib/utils';

type DragMode = 'move' | 'resize';

interface DragState {
  mode: DragMode;
  sectionId: string;
  startX: number;
  startY: number;
  startRect: TvGridRect;
}

const KIND_ICON = {
  drinks: GlassWater,
  media: ImageIcon,
  text: Type,
  chart: LineChart,
} as const;

/** Каждая N-я линия сетки рисуется ярче — так проще ориентироваться. */
const MAJOR_STEP = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Схема раскладки экрана: секции можно перетаскивать и растягивать по сетке
 * 12×12. Пропорция 16:9 совпадает с телевизором, поэтому то, что видно здесь,
 * повторится на экране.
 */
export default function LayoutCanvas({
  sections,
  selectedId,
  orientation,
  onSelect,
  onRectChange,
}: {
  sections: TvMenuSection[];
  selectedId: string | null;
  orientation: TvOrientation;
  onSelect: (id: string) => void;
  onRectChange: (id: string, rect: TvGridRect) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const beginDrag = (
    event: React.PointerEvent,
    section: TvMenuSection,
    mode: DragMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(section.id);
    dragRef.current = {
      mode,
      sectionId: section.id,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...section.rect },
    };
    setDragging(section.id);
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || !container) return;

    const box = container.getBoundingClientRect();
    const cellW = box.width / GRID_COLUMNS;
    const cellH = box.height / GRID_ROWS;

    const dx = Math.round((event.clientX - drag.startX) / cellW);
    const dy = Math.round((event.clientY - drag.startY) / cellH);
    const start = drag.startRect;

    if (drag.mode === 'move') {
      onRectChange(drag.sectionId, {
        ...start,
        x: clamp(start.x + dx, 0, GRID_COLUMNS - start.w),
        y: clamp(start.y + dy, 0, GRID_ROWS - start.h),
      });
    } else {
      onRectChange(drag.sectionId, {
        ...start,
        w: clamp(start.w + dx, 1, GRID_COLUMNS - start.x),
        h: clamp(start.h + dy, 1, GRID_ROWS - start.y),
      });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={cn(
        'relative w-full touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-el',
        orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video',
      )}
      style={{
        backgroundImage: [
          'linear-gradient(to right, rgba(110,95,84,0.22) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(110,95,84,0.22) 1px, transparent 1px)',
          'linear-gradient(to right, rgba(110,95,84,0.09) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(110,95,84,0.09) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: [
          `${(100 * MAJOR_STEP) / GRID_COLUMNS}% ${(100 * MAJOR_STEP) / GRID_ROWS}%`,
          `${(100 * MAJOR_STEP) / GRID_COLUMNS}% ${(100 * MAJOR_STEP) / GRID_ROWS}%`,
          `${100 / GRID_COLUMNS}% ${100 / GRID_ROWS}%`,
          `${100 / GRID_COLUMNS}% ${100 / GRID_ROWS}%`,
        ].join(', '),
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {sections.map((section) => {
          const Icon = KIND_ICON[section.kind];
          const active = selectedId === section.id;
          return (
            <div
              key={section.id}
              onPointerDown={(e) => beginDrag(e, section, 'move')}
              className={cn(
                'group relative m-0.5 cursor-grab overflow-hidden rounded-lg border-2 transition-colors',
                active
                  ? 'border-orange bg-orange/15'
                  : 'border-border bg-surface hover:border-orange/40',
                dragging === section.id && 'cursor-grabbing opacity-80',
              )}
              style={{
                gridColumn: `${section.rect.x + 1} / span ${section.rect.w}`,
                gridRow: `${section.rect.y + 1} / span ${section.rect.h}`,
              }}
            >
              <div className="pointer-events-none flex h-full flex-col items-start gap-1 p-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <Icon size={12} className={active ? 'text-orange' : 'text-muted'} />
                  <span className="truncate">{section.title || 'Без заголовка'}</span>
                </span>
                <span className="text-[10px] text-muted">
                  {section.rect.w}×{section.rect.h}
                  {section.kind === 'drinks' && ` · ${section.items.length} поз.`}
                </span>
              </div>

              {/* Ручка изменения размера */}
              <div
                onPointerDown={(e) => beginDrag(e, section, 'resize')}
                className={cn(
                  'absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl-md transition-colors',
                  active ? 'bg-orange' : 'bg-border group-hover:bg-orange/60',
                )}
                title="Потяните, чтобы изменить размер"
              />
            </div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted">Добавьте секцию, чтобы начать раскладку</p>
        </div>
      )}
    </div>
  );
}

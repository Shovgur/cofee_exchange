'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';
import DecorativeBarcode from '@/components/ui/DecorativeBarcode';

export default function ProfileBarcode({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted px-1">
          Личный штрихкод
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full relative group"
          aria-label="Увеличить штрихкод"
        >
          <DecorativeBarcode value={value} size="compact" />
          <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900/10 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={13} />
          </span>
        </button>
      </div>

      {expanded && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Личный штрихкод
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <DecorativeBarcode value={value} size="default" className="w-full rounded-3xl shadow-2xl" />
            <p className="text-center text-xs text-white/50">Нажмите за пределами штрихкода, чтобы закрыть</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

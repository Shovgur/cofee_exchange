'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10060] flex justify-center',
        /* mobile: bottom sheet на весь экран, без отступа под навбар */
        'items-end px-0 pb-0',
        'lg:items-center lg:p-4',
      )}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative flex w-full max-w-lg flex-col bg-surface shadow-2xl',
          'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-0.25rem))]',
          'rounded-t-3xl lg:max-h-[min(90dvh,40rem)] lg:rounded-3xl',
          'pb-[env(safe-area-inset-bottom,0px)]',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 px-6 py-4">
          {title ? (
            <h2 id="modal-title" className="pr-2 text-lg font-semibold">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-surface-el"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

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
        /* mobile: bottom sheet — sits above the bottom nav */
        'items-end px-0 pb-nav-safe',
        /* desktop: centered dialog */
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
        className={cn(
          'relative w-full max-w-lg bg-surface p-6 pb-8 safe-pb',
          'max-h-[90dvh] overflow-y-auto shadow-2xl',
          /* mobile: sheet from bottom */
          'rounded-t-3xl',
          /* desktop: card in center */
          'lg:rounded-3xl lg:pb-6',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          {title ? (
            <h2 className="text-lg font-semibold pr-2">{title}</h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl hover:bg-surface-el transition-colors -mr-1"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

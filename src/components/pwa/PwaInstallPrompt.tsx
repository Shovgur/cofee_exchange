'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Share, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'ce_pwa_install_dismissed';

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone);
    if (isStandalone) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* noop */
    }

    const ua = navigator.userAgent || '';
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1);

    if (isIos) {
      setShowIos(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = useCallback(() => {
    setShowIos(false);
    setDeferred(null);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }, [deferred, dismiss]);

  if (standalone) return null;

  if (showIos) {
    return (
      <div className="fixed inset-0 z-[10040] flex items-end justify-center p-4 pb-[5.5rem] pointer-events-none lg:items-center lg:pb-4">
        <div className="w-full max-w-md pointer-events-auto">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange/20 flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-orange" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">На экран «Домой»</p>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  <Share size={12} className="inline mr-1 align-middle" />
                  Поделиться → «На экран «Домой»»
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-1.5 rounded-lg hover:bg-surface-el text-muted flex-shrink-0"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (deferred) {
    return (
      <div className="fixed inset-0 z-[10040] flex items-end justify-center p-4 pb-[5.5rem] pointer-events-none lg:items-center lg:pb-4">
        <div className="w-full max-w-md pointer-events-auto">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange/20 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Coffee Exchange</p>
            <p className="text-xs text-muted">Установите приложение на устройство</p>
          </div>
          <button
            type="button"
            onClick={install}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-orange text-white text-sm font-medium hover:bg-orange-dark transition-colors"
          >
            Установить
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="p-2 rounded-xl hover:bg-surface-el text-muted flex-shrink-0"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        </div>
      </div>
    );
  }

  return null;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Тонкий прогресс-бар вверху экрана при навигации.
 * - Стартует при клике на внутренние ссылки (перехватываем через document click).
 * - Ползёт от 0 → 85% пока идёт переход.
 * - Прыгает до 100% и исчезает, когда pathname меняется.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);

  const prevPath = useRef(pathname);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  function start() {
    if (activeRef.current) return;
    activeRef.current = true;
    setProgress(8);
    setCompleting(false);
    setVisible(true);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 82) { clearInterval(intervalRef.current!); return p; }
        // замедляет по мере приближения к 82%
        return p + (82 - p) * 0.06 + 1;
      });
    }, 120);
  }

  function complete() {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCompleting(true);
    setProgress(100);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      setCompleting(false);
    }, 450);
  }

  // Перехватываем клики на внутренние ссылки чтобы стартовать бар
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element).closest('a');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      // Только внутренние ссылки без якорей
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto')) return;
      // Средний клик / ctrl+click → открытие в новой вкладке, не навигация
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      start();
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // pathname изменился → навигация завершена
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      complete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Чистим таймеры при анмаунте
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
      {/* Основная линия */}
      <div
        className="h-[3px] origin-left"
        style={{
          background: 'linear-gradient(90deg, #FF6B35, #FF8C5A)',
          width: `${progress}%`,
          transition: completing
            ? 'width 0.35s cubic-bezier(.4,0,.2,1), opacity 0.3s 0.15s'
            : 'width 0.12s linear',
          opacity: completing && progress === 100 ? 0 : 1,
          boxShadow: '0 0 10px rgba(255,107,53,0.7), 0 0 20px rgba(255,107,53,0.4)',
        }}
      />
      {/* Ореол на конце линии */}
      {!completing && (
        <div
          className="absolute top-0 h-[3px] w-20 -translate-x-1/2"
          style={{
            left: `${progress}%`,
            background:
              'radial-gradient(ellipse at center, rgba(255,107,53,0.9) 0%, transparent 70%)',
            filter: 'blur(3px)',
          }}
        />
      )}
    </div>
  );
}

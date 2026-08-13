'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { usePrices } from '@/contexts/PricesContext';
import TvMenuBoard from '@/components/tv-menu/TvMenuBoard';
import { fetchTvMenuDocument } from '@/lib/tv-menu/api';
import {
  defaultTvMenuDocument,
  findBoard,
  type TvMenuDocument,
} from '@/lib/tv-menu/config';
import { resolveScreens, screenHasContent } from '@/lib/tv-menu/resolve';

/** Как часто экран проверяет, не поменял ли админ конфиг. */
const CONFIG_POLL_MS = 20_000;

export default function TvMenuRuntime({ boardId }: { boardId?: string }) {
  const { country } = useCountry();
  const { drinks, loading, error, secondsUntilNextPoll, flashMap, flashGen } = usePrices();

  const [doc, setDoc] = useState<TvMenuDocument>(defaultTvMenuDocument);
  const [screenIndex, setScreenIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const next = await fetchTvMenuDocument();
        if (cancelled) return;
        // Перерисовываем только при реальном изменении, чтобы не сбивать анимации.
        setDoc((prev) => (prev.updatedAt === next.updatedAt ? prev : next));
      } catch {
        // Экран продолжает работать на последнем известном конфиге.
      }
    };

    void pull();
    const id = setInterval(() => void pull(), CONFIG_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const board = findBoard(doc, boardId);

  const screens = useMemo(
    () => (board ? resolveScreens(board, drinks) : []),
    [board, drinks],
  );

  const visibleScreens = useMemo(() => {
    const withContent = screens.filter(screenHasContent);
    return withContent.length > 0 ? withContent : screens;
  }, [screens]);

  useEffect(() => {
    if (screenIndex >= visibleScreens.length) setScreenIndex(0);
  }, [visibleScreens.length, screenIndex]);

  useEffect(() => {
    if (!board?.rotation.enabled || visibleScreens.length < 2) return;
    const id = setInterval(
      () => setScreenIndex((i) => (i + 1) % visibleScreens.length),
      board.rotation.intervalSec * 1000,
    );
    return () => clearInterval(id);
  }, [board?.rotation.enabled, board?.rotation.intervalSec, visibleScreens.length]);

  if (!board) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-2 bg-bg px-6 text-center">
        <p className="text-lg font-semibold">Меню не найдено</p>
        <p className="text-sm text-muted">
          Такой доски нет в настройках. Проверьте ссылку в админке.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh]">
      <TvMenuBoard
        board={board}
        screen={visibleScreens[screenIndex]}
        country={country}
        loading={loading}
        error={error}
        secondsUntilNextPoll={secondsUntilNextPoll}
        flashMap={flashMap}
        flashGen={flashGen}
        screenCount={visibleScreens.length}
        screenIndex={screenIndex}
      />
    </div>
  );
}

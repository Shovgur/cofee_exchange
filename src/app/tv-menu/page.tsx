'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { usePrices } from '@/contexts/PricesContext';
import TvMenuBoard from '@/components/tv-menu/TvMenuBoard';
import { fetchTvMenuConfig } from '@/lib/tv-menu/api';
import { defaultTvMenuConfig, type TvMenuConfig } from '@/lib/tv-menu/config';
import { resolveScreens } from '@/lib/tv-menu/resolve';

/** Как часто экран проверяет, не поменял ли админ конфиг. */
const CONFIG_POLL_MS = 20_000;

export default function TvMenuPage() {
  const { country } = useCountry();
  const { drinks, loading, error, secondsUntilNextPoll, flashMap, flashGen } = usePrices();

  const [config, setConfig] = useState<TvMenuConfig>(defaultTvMenuConfig);
  const [screenIndex, setScreenIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const next = await fetchTvMenuConfig();
        if (cancelled) return;
        // Перерисовываем только при реальном изменении, чтобы не сбивать анимации.
        setConfig((prev) => (prev.updatedAt === next.updatedAt ? prev : next));
      } catch {
        // Экран продолжает работать на последнем известном конфиге.
      }
    };

    void pull();
    const id = setInterval(() => void pull(), CONFIG_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const screens = useMemo(() => resolveScreens(config, drinks), [config, drinks]);

  const visibleScreens = useMemo(() => {
    const withContent = screens.filter((s) => s.sections.some((sec) => sec.items.length > 0));
    return withContent.length > 0 ? withContent : screens;
  }, [screens]);

  useEffect(() => {
    if (screenIndex >= visibleScreens.length) setScreenIndex(0);
  }, [visibleScreens.length, screenIndex]);

  useEffect(() => {
    if (!config.rotation.enabled || visibleScreens.length < 2) return;
    const id = setInterval(
      () => setScreenIndex((i) => (i + 1) % visibleScreens.length),
      config.rotation.intervalSec * 1000,
    );
    return () => clearInterval(id);
  }, [config.rotation.enabled, config.rotation.intervalSec, visibleScreens.length]);

  return (
    <div className="h-[100dvh]">
      <TvMenuBoard
        config={config}
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

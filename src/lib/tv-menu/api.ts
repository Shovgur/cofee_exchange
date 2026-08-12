import {
  normalizeTvMenuConfig,
  type TvMenuConfig,
} from '@/lib/tv-menu/config';

const ENDPOINT = '/api/tv-menu-config';

export async function fetchTvMenuConfig(): Promise<TvMenuConfig> {
  const res = await fetch(ENDPOINT, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Не удалось загрузить конфиг ТВ-меню (${res.status})`);
  return normalizeTvMenuConfig(await res.json());
}

export async function saveTvMenuConfig(
  config: TvMenuConfig,
): Promise<{ config: TvMenuConfig; persisted: boolean }> {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Ошибка сохранения (${res.status})`);
  }
  const raw = (await res.json()) as { persisted?: boolean };
  return {
    config: normalizeTvMenuConfig(raw),
    persisted: raw.persisted !== false,
  };
}

import {
  normalizeTvMenuDocument,
  type TvMenuDocument,
} from '@/lib/tv-menu/config';

const ENDPOINT = '/api/tv-menu-config';

export async function fetchTvMenuDocument(): Promise<TvMenuDocument> {
  const res = await fetch(ENDPOINT, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Не удалось загрузить конфиг ТВ-меню (${res.status})`);
  return normalizeTvMenuDocument(await res.json());
}

export async function saveTvMenuDocument(
  doc: TvMenuDocument,
): Promise<{ doc: TvMenuDocument; persisted: boolean }> {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 200) || `Ошибка сохранения (${res.status})`);
  }
  const raw = (await res.json()) as { persisted?: boolean };
  return {
    doc: normalizeTvMenuDocument(raw),
    persisted: raw.persisted !== false,
  };
}

import { buildApiPath } from '@/lib/api/exchange/client';
import type {
  ApiAdminRecalcResponse,
  ApiAdminSettings,
  ApiAdminSettingsHistoryItem,
  ApiAdminSettingsUpdate,
} from '@/lib/api/exchange/types';

export async function fetchAdminSettings(): Promise<ApiAdminSettings> {
  const url = buildApiPath('v1/admin/settings');
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка загрузки настроек: ${res.status}`);
  try {
    return JSON.parse(raw) as ApiAdminSettings;
  } catch {
    throw new Error('Сервер вернул не JSON');
  }
}

export async function putAdminSettings(payload: ApiAdminSettingsUpdate): Promise<ApiAdminSettings> {
  const url = buildApiPath('v1/admin/settings');
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка сохранения настроек: ${res.status}`);
  try {
    return JSON.parse(raw) as ApiAdminSettings;
  } catch {
    throw new Error('Сервер вернул не JSON');
  }
}

export async function fetchAdminSettingsHistory(): Promise<ApiAdminSettingsHistoryItem[]> {
  const url = buildApiPath('v1/admin/settings/history');
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Ошибка загрузки истории: ${res.status}`);
  try {
    return JSON.parse(raw) as ApiAdminSettingsHistoryItem[];
  } catch {
    throw new Error('Сервер вернул не JSON');
  }
}

export async function postAdminRecalc(): Promise<ApiAdminRecalcResponse> {
  const url = buildApiPath('v1/admin/recalc');
  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  const raw = await res.text();
  if (!res.ok) {
    const hint = raw.trim() ? ` — ${raw.slice(0, 300)}` : '';
    throw new Error(`Ошибка пересчёта: ${res.status}${hint}`);
  }
  try {
    return JSON.parse(raw) as ApiAdminRecalcResponse;
  } catch {
    throw new Error('Сервер вернул не JSON');
  }
}

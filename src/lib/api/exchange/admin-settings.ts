import { buildApiPath, parseExchangeJson } from '@/lib/api/exchange/client';
import type {
  ApiAdminRecalcResponse,
  ApiAdminSettings,
  ApiAdminSettingsHistoryItem,
  ApiAdminSettingsUpdate,
} from '@/lib/api/exchange/types';

const fetchOpts: RequestInit = { cache: 'no-store', headers: { Accept: 'application/json' } };

export async function fetchAdminSettings(): Promise<ApiAdminSettings> {
  const res = await fetch(buildApiPath('v1/admin/settings'), fetchOpts);
  return parseExchangeJson<ApiAdminSettings>(res);
}

export async function putAdminSettings(payload: ApiAdminSettingsUpdate): Promise<ApiAdminSettings> {
  const res = await fetch(buildApiPath('v1/admin/settings'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseExchangeJson<ApiAdminSettings>(res);
}

export async function fetchAdminSettingsHistory(): Promise<ApiAdminSettingsHistoryItem[]> {
  const res = await fetch(buildApiPath('v1/admin/settings/history'), fetchOpts);
  return parseExchangeJson<ApiAdminSettingsHistoryItem[]>(res);
}

export async function postAdminRecalc(): Promise<ApiAdminRecalcResponse> {
  const res = await fetch(buildApiPath('v1/admin/recalc'), {
    method: 'POST',
    ...fetchOpts,
  });
  return parseExchangeJson<ApiAdminRecalcResponse>(res);
}

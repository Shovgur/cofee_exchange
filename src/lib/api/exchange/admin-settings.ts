import { exchangeAdminJson, exchangeJson } from '@/lib/api/exchange/client';
import type {
  ApiAdminRecalcResponse,
  ApiAdminSettings,
  ApiAdminSettingsHistoryItem,
  ApiAdminSettingsUpdate,
} from '@/lib/api/exchange/types';

export async function fetchAdminSettings(): Promise<ApiAdminSettings> {
  return exchangeAdminJson<ApiAdminSettings>('v1/admin/settings');
}

export async function putAdminSettings(payload: ApiAdminSettingsUpdate): Promise<ApiAdminSettings> {
  return exchangeAdminJson<ApiAdminSettings>('v1/admin/settings', {
    method: 'PUT',
    ...exchangeJson(payload),
  });
}

export async function fetchAdminSettingsHistory(): Promise<ApiAdminSettingsHistoryItem[]> {
  return exchangeAdminJson<ApiAdminSettingsHistoryItem[]>('v1/admin/settings/history');
}

export async function postAdminRecalc(): Promise<ApiAdminRecalcResponse> {
  return exchangeAdminJson<ApiAdminRecalcResponse>('v1/admin/recalc', { method: 'POST' });
}

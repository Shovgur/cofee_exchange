import { buildApiPath } from '@/lib/api/exchange/client';
import type { ApiSaleBatchRequest } from '@/lib/api/exchange/types';

export async function postSaleBatch(payload: ApiSaleBatchRequest): Promise<void> {
  const url = buildApiPath('v1/sales/batch');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ошибка регистрации продаж: ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}`);
  }
}

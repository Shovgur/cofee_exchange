import {
  clearStoredTokens,
  loyaltyFetch,
  loyaltyJson,
  storeTokens,
} from '@/lib/api/loyalty/client';
import type { ApiTokenPair } from '@/lib/api/loyalty/types';

export async function requestSmsCode(phone: string): Promise<void> {
  await loyaltyFetch<{ detail: string }>('auth/sms/request', {
    method: 'POST',
    ...loyaltyJson({ phone }),
  });
}

export async function verifySmsCode(
  phone: string,
  code: string,
): Promise<ApiTokenPair> {
  const data = await loyaltyFetch<ApiTokenPair>('auth/sms/verify', {
    method: 'POST',
    ...loyaltyJson({ phone, code }),
  });
  storeTokens(data);
  return data;
}

export async function logoutSession(refreshToken: string): Promise<void> {
  try {
    await loyaltyFetch<{ detail: string }>('auth/logout', {
      method: 'POST',
      ...loyaltyJson({ refresh_token: refreshToken }),
    });
  } finally {
    clearStoredTokens();
  }
}

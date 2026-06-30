import {
  clearStoredTokens,
  LoyaltyApiError,
  loyaltyFetch,
  loyaltyJson,
  storeTokens,
} from '@/lib/api/loyalty/client';
import {
  getSmsCooldownSeconds,
  markSmsBlocked,
  markSmsRequested,
  normalizePhoneKey,
} from '@/lib/auth/sms-cooldown';
import type { ApiTokenPair } from '@/lib/api/loyalty/types';

const smsInflight = new Map<string, Promise<void>>();

export async function requestSmsCode(phone: string): Promise<void> {
  const key = normalizePhoneKey(phone);
  if (!key) {
    throw new LoyaltyApiError('Некорректный номер телефона', 422);
  }

  const cooldown = getSmsCooldownSeconds(phone);
  if (cooldown > 0) {
    throw new LoyaltyApiError(
      `Слишком частые запросы SMS. Повторите через ${cooldown} сек.`,
      429,
      undefined,
      cooldown,
    );
  }

  const existing = smsInflight.get(key);
  if (existing) return existing;

  const request = (async () => {
    try {
      await loyaltyFetch<{ detail: string }>('auth/sms/request', {
        method: 'POST',
        ...loyaltyJson({ phone }),
      });
      markSmsRequested(phone);
    } catch (err) {
      if (err instanceof LoyaltyApiError && err.status === 429 && err.retryAfterSeconds) {
        markSmsBlocked(phone, err.retryAfterSeconds);
      }
      throw err;
    } finally {
      smsInflight.delete(key);
    }
  })();

  smsInflight.set(key, request);
  return request;
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

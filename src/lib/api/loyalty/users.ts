import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';
import type { ApiBarcode, ApiGender, ApiUserProfile } from '@/lib/api/loyalty/types';

export async function fetchCurrentUser(): Promise<ApiUserProfile> {
  return loyaltyFetch<ApiUserProfile>('users/me', { auth: true });
}

export async function patchCurrentUser(
  body: Partial<{
    first_name: string;
    last_name: string;
    middle_name: string | null;
    birth_date: string;
    email: string;
    gender: ApiGender;
    country_code: string;
    consent_version: string;
  }>,
): Promise<ApiUserProfile> {
  return loyaltyFetch<ApiUserProfile>('users/me', {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function fetchUserBarcode(): Promise<ApiBarcode> {
  return loyaltyFetch<ApiBarcode>('users/me/barcode', { auth: true });
}

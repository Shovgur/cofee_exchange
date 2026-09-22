import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';

export async function adminSendUserNotification(
  userId: string,
  body: { title: string; body: string; kind?: string; data?: Record<string, unknown> },
): Promise<{ id: string; title: string; body: string; created_at: string }> {
  return loyaltyFetch(`admin/users/${userId}/notifications`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminBroadcastNotification(body: {
  title: string;
  body: string;
  kind?: string;
  data?: Record<string, unknown>;
  country?: string;
  include_blocked?: boolean;
}): Promise<{ sent: number }> {
  return loyaltyFetch('admin/notifications/broadcast', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

import { loyaltyFetch, loyaltyJson } from '@/lib/api/loyalty/client';

export type SupportTicketStatus = 'open' | 'in_progress' | 'answered' | 'closed';
export type SupportTicketCategory =
  | 'question'
  | 'problem'
  | 'refund'
  | 'block_appeal'
  | 'other';

export interface SupportMessage {
  id: string;
  author_type: 'user' | 'admin';
  body: string;
  attachments?: string[];
  created_at: string;
}

export interface SupportTicketListItem {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  category: SupportTicketCategory;
  user_id: string;
  user_phone: string;
  user_name: string | null;
  unread_from_user: number;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicketListItem {
  messages: SupportMessage[];
}

export interface SupportTicketPage {
  items: SupportTicketListItem[];
  total: number;
  limit: number;
  offset: number;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Обращение из приложения. */
export async function createSupportTicket(body: {
  subject: string;
  body: string;
  category?: SupportTicketCategory;
}): Promise<SupportTicketDetail> {
  return loyaltyFetch<SupportTicketDetail>('support/tickets', {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminListSupportTickets(params: {
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  query?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<SupportTicketPage> {
  const qs = buildQuery({ ...params, query: params.query?.trim() });
  return loyaltyFetch<SupportTicketPage>(`admin/support/tickets${qs}`, { auth: true });
}

export async function adminGetSupportTicket(ticketId: string): Promise<SupportTicketDetail> {
  return loyaltyFetch<SupportTicketDetail>(`admin/support/tickets/${ticketId}`, { auth: true });
}

export async function adminReplySupportTicket(
  ticketId: string,
  body: { body: string; attachments?: string[] },
): Promise<SupportTicketDetail> {
  return loyaltyFetch<SupportTicketDetail>(`admin/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    auth: true,
    ...loyaltyJson(body),
  });
}

export async function adminPatchSupportTicket(
  ticketId: string,
  body: { status: SupportTicketStatus },
): Promise<SupportTicketDetail> {
  return loyaltyFetch<SupportTicketDetail>(`admin/support/tickets/${ticketId}`, {
    method: 'PATCH',
    auth: true,
    ...loyaltyJson(body),
  });
}

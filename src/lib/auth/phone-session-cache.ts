import type { ApiTokenPair } from '@/lib/api/loyalty/types';

const SESSIONS_KEY = 'ce_phone_sessions';
const SMS_PENDING_KEY = 'ce_sms_pending';

/** Не запрашивать SMS повторно, если недавно уже запрашивали для этого номера */
const SMS_REQUEST_COOLDOWN_MS = 15 * 60 * 1000;

interface PhoneSessionEntry {
  tokens: ApiTokenPair;
  savedAt: string;
  /** Последний успешно использованный код (для подсказки в dev) */
  lastCode?: string;
}

interface SmsPendingEntry {
  requestedAt: string;
}

type SessionMap = Record<string, PhoneSessionEntry>;
type PendingMap = Record<string, SmsPendingEntry>;

export function isPhoneSessionCacheEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PHONE_SESSION_CACHE === 'true';
}

export function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, '');
}

function readSessions(): SessionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionMap;
  } catch {
    return {};
  }
}

function writeSessions(map: SessionMap): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function readPending(): PendingMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SMS_PENDING_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PendingMap;
  } catch {
    return {};
  }
}

function writePending(map: PendingMap): void {
  try {
    localStorage.setItem(SMS_PENDING_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function savePhoneSession(
  phone: string,
  tokens: ApiTokenPair,
  lastCode?: string,
): void {
  if (!isPhoneSessionCacheEnabled()) return;
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = readSessions();
  map[key] = {
    tokens,
    savedAt: new Date().toISOString(),
    ...(lastCode ? { lastCode } : {}),
  };
  writeSessions(map);
}

export function getPhoneSession(phone: string): PhoneSessionEntry | null {
  if (!isPhoneSessionCacheEnabled()) return null;
  const key = normalizePhoneKey(phone);
  return readSessions()[key] ?? null;
}

export function hasCachedPhoneSession(phone: string): boolean {
  return getPhoneSession(phone)?.tokens.refresh_token != null;
}

export function markSmsRequested(phone: string): void {
  if (!isPhoneSessionCacheEnabled()) return;
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = readPending();
  map[key] = { requestedAt: new Date().toISOString() };
  writePending(map);
}

export function shouldSkipSmsRequest(phone: string): boolean {
  if (!isPhoneSessionCacheEnabled()) return false;
  const key = normalizePhoneKey(phone);
  const entry = readPending()[key];
  if (!entry) return false;
  return Date.now() - new Date(entry.requestedAt).getTime() < SMS_REQUEST_COOLDOWN_MS;
}

export function clearPhoneSession(phone: string): void {
  const key = normalizePhoneKey(phone);
  const sessions = readSessions();
  delete sessions[key];
  writeSessions(sessions);
  const pending = readPending();
  delete pending[key];
  writePending(pending);
}

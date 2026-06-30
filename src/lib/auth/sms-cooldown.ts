const SMS_PENDING_KEY = 'ce_sms_pending';

/** Минимальный интервал между запросами auth/sms/request */
const SMS_MIN_INTERVAL_MS = 60 * 1000;

interface SmsPendingEntry {
  requestedAt: string;
  blockedUntil?: number;
}

type PendingMap = Record<string, SmsPendingEntry>;

export function normalizePhoneKey(phone: string): string {
  return phone.replace(/\D/g, '');
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

function pendingEntry(phone: string): SmsPendingEntry | null {
  const key = normalizePhoneKey(phone);
  if (!key) return null;
  return readPending()[key] ?? null;
}

export function markSmsRequested(phone: string): void {
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = readPending();
  map[key] = { requestedAt: new Date().toISOString() };
  writePending(map);
}

export function markSmsBlocked(phone: string, retryAfterSeconds: number): void {
  const key = normalizePhoneKey(phone);
  if (!key || retryAfterSeconds <= 0) return;
  const map = readPending();
  const prev = map[key];
  map[key] = {
    requestedAt: prev?.requestedAt ?? new Date().toISOString(),
    blockedUntil: Date.now() + retryAfterSeconds * 1000,
  };
  writePending(map);
}

/** Секунд до следующего разрешённого запроса SMS (0 = можно) */
export function getSmsCooldownSeconds(phone: string): number {
  const entry = pendingEntry(phone);
  if (!entry) return 0;

  const waits: number[] = [];

  if (entry.blockedUntil) {
    waits.push(Math.ceil((entry.blockedUntil - Date.now()) / 1000));
  }

  const sinceRequest = Date.now() - new Date(entry.requestedAt).getTime();
  const minIntervalLeft = Math.ceil((SMS_MIN_INTERVAL_MS - sinceRequest) / 1000);
  if (minIntervalLeft > 0) waits.push(minIntervalLeft);

  return Math.max(0, ...waits);
}

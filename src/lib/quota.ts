import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { adminAuth } from './firebase-admin';

export const GUEST_QUOTA_LIMIT = 4;
export const GUEST_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours = 7,200,000 ms

export const MEMBER_QUOTA_LIMIT = 50;
export const MEMBER_WINDOW_MS = 60 * 60 * 1000; // 1 hour = 3,600,000 ms

export interface QuotaStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  windowDurationSeconds: number;
  nextAvailableScanTimestamp: number | null;
  retryAfterSeconds: number;
  isGuest: boolean;
}

const GUEST_SECRET =
  process.env.GUEST_SECRET ||
  process.env.FIREBASE_API_KEY ||
  'eatinformed_production_guest_secret_seed_2026';

// Persistent storage path: survives process restarts and serverless container warm cycles
const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'scan_quota_store.json');

// In-memory cache synced with disk
let inMemoryQuotaMap = new Map<string, number[]>();
let storeLoaded = false;

function ensureStoreDir(): void {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
  } catch (_) {
    // If working directory is read-only (e.g. some lambda environments), fallback handled gracefully
  }
}

function loadStoreFromDisk(): void {
  if (storeLoaded) return;
  try {
    ensureStoreDir();
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (typeof data === 'object' && data !== null) {
        inMemoryQuotaMap = new Map(Object.entries(data));
      }
    }
    storeLoaded = true;
  } catch (err) {
    console.warn('Quota store disk read error, using memory fallback:', err);
    storeLoaded = true;
  }
}

function saveStoreToDisk(): void {
  try {
    ensureStoreDir();
    const obj: Record<string, number[]> = {};
    const now = Date.now();

    // Clean up timestamps older than max window (2 hours)
    inMemoryQuotaMap.forEach((timestamps, key) => {
      const active = timestamps.filter((t) => now - t < GUEST_WINDOW_MS);
      if (active.length > 0) {
        obj[key] = active;
      }
    });

    const tempFile = `${STORE_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    console.warn('Quota store disk write error:', err);
  }
}

// ---------------------------------------------------------------------------
// Cryptographic Guest Token Generation & Verification
// ---------------------------------------------------------------------------

export function createCryptographicGuestToken(uid: string): string {
  const issuedAt = Date.now();
  const payload = `${uid}:${issuedAt}`;
  const signature = crypto
    .createHmac('sha256', GUEST_SECRET)
    .update(payload)
    .digest('hex');
  return `guest_${Buffer.from(payload).toString('base64url')}.${signature}`;
}

export function verifyGuestToken(token: string): { valid: boolean; uid: string | null } {
  if (!token || !token.startsWith('guest_')) {
    return { valid: false, uid: null };
  }

  const parts = token.slice(6).split('.');
  if (parts.length !== 2) {
    return { valid: false, uid: null };
  }

  const [b64Payload, signature] = parts;
  try {
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const [uid, issuedAtStr] = payload.split(':');
    if (!uid || !issuedAtStr) {
      return { valid: false, uid: null };
    }

    const expectedSig = crypto
      .createHmac('sha256', GUEST_SECRET)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, uid: null };
    }

    const issuedAt = parseInt(issuedAtStr, 10);
    // Guest token valid for 30 days
    if (isNaN(issuedAt) || Date.now() - issuedAt > 30 * 24 * 60 * 60 * 1000) {
      return { valid: false, uid: null };
    }

    return { valid: true, uid };
  } catch (_) {
    return { valid: false, uid: null };
  }
}

export async function verifyUserToken(
  token: string
): Promise<{ userId: string | null; isGuest: boolean; error?: string }> {
  if (!token) return { userId: null, isGuest: true, error: 'missing_token' };

  // 1. Check if token is a cryptographic guest token
  const guestVerification = verifyGuestToken(token);
  if (guestVerification.valid && guestVerification.uid) {
    return { userId: guestVerification.uid, isGuest: true };
  }

  // 2. Check Firebase Admin Auth if initialized
  if (adminAuth) {
    try {
      // checkRevoked = true: Enforces security revocation checks
      const decoded = await adminAuth.verifyIdToken(token, true);
      const isAnon = decoded.firebase?.sign_in_provider === 'anonymous';
      return { userId: decoded.uid, isGuest: isAnon };
    } catch (_) {
      try {
        const decodedSession = await adminAuth.verifySessionCookie(token, true);
        const isAnon = decodedSession.firebase?.sign_in_provider === 'anonymous';
        return { userId: decodedSession.uid, isGuest: isAnon };
      } catch (_) {}
    }
  }

  // No arbitrary strings or backdoor prefixes allowed
  return { userId: null, isGuest: true, error: 'invalid_or_expired_token' };
}

// ---------------------------------------------------------------------------
// Atomic Sliding Window Quota Enforcement
// ---------------------------------------------------------------------------

export function inspectQuota(userId: string, isGuest: boolean): QuotaStatus {
  loadStoreFromDisk();
  const now = Date.now();
  const limit = isGuest ? GUEST_QUOTA_LIMIT : MEMBER_QUOTA_LIMIT;
  const windowMs = isGuest ? GUEST_WINDOW_MS : MEMBER_WINDOW_MS;

  const timestamps = (inMemoryQuotaMap.get(userId) || []).filter((t) => now - t < windowMs);
  inMemoryQuotaMap.set(userId, timestamps);

  if (timestamps.length >= limit) {
    const oldestTimestamp = Math.min(...timestamps);
    const nextAvailableScanTimestamp = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((nextAvailableScanTimestamp - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      windowDurationSeconds: Math.floor(windowMs / 1000),
      nextAvailableScanTimestamp,
      retryAfterSeconds,
      isGuest,
    };
  }

  const remaining = limit - timestamps.length;
  const nextAvailableScanTimestamp =
    timestamps.length > 0 ? Math.min(...timestamps) + windowMs : null;

  return {
    allowed: true,
    limit,
    remaining,
    windowDurationSeconds: Math.floor(windowMs / 1000),
    nextAvailableScanTimestamp,
    retryAfterSeconds: 0,
    isGuest,
  };
}

export function consumeQuotaSlot(userId: string, isGuest: boolean): QuotaStatus {
  loadStoreFromDisk();
  const now = Date.now();
  const limit = isGuest ? GUEST_QUOTA_LIMIT : MEMBER_QUOTA_LIMIT;
  const windowMs = isGuest ? GUEST_WINDOW_MS : MEMBER_WINDOW_MS;

  const current = (inMemoryQuotaMap.get(userId) || []).filter((t) => now - t < windowMs);

  if (current.length >= limit) {
    const oldestTimestamp = Math.min(...current);
    const nextAvailableScanTimestamp = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((nextAvailableScanTimestamp - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      windowDurationSeconds: Math.floor(windowMs / 1000),
      nextAvailableScanTimestamp,
      retryAfterSeconds,
      isGuest,
    };
  }

  // Atomically reserve the slot
  current.push(now);
  inMemoryQuotaMap.set(userId, current);
  saveStoreToDisk();

  const remaining = limit - current.length;
  const nextAvailableScanTimestamp = Math.min(...current) + windowMs;

  return {
    allowed: true,
    limit,
    remaining,
    windowDurationSeconds: Math.floor(windowMs / 1000),
    nextAvailableScanTimestamp,
    retryAfterSeconds: 0,
    isGuest,
  };
}

export function refundQuotaSlot(userId: string): void {
  loadStoreFromDisk();
  const current = inMemoryQuotaMap.get(userId);
  if (current && current.length > 0) {
    current.pop();
    inMemoryQuotaMap.set(userId, current);
    saveStoreToDisk();
  }
}

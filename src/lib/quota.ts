import { createHash } from 'crypto';
import { Firestore } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import { ApiError } from './api-error';
import type { Identity } from './request';
export const GUEST_QUOTA_LIMIT = 4;
export const GUEST_WINDOW_MS = 7_200_000;
export const MEMBER_QUOTA_LIMIT = Number(process.env.MEMBER_QUOTA_LIMIT || 50);
export const MEMBER_WINDOW_MS = 3_600_000;
type Event = { id: string; at: number };
export function quotaStatus(events: Event[], guest: boolean, now: number) {
  const limit = guest ? GUEST_QUOTA_LIMIT : MEMBER_QUOTA_LIMIT;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new ApiError(503, 'quota_unavailable', 'Scan limits are unavailable.');
  const windowMs = guest ? GUEST_WINDOW_MS : MEMBER_WINDOW_MS;
  const active = events.filter(e => e.at > now - windowMs);
  const remaining = Math.max(0, limit - active.length);
  const nextAvailableAt = remaining ? null : active[active.length - limit].at + windowMs;
  return { allowed: remaining > 0, limit, remaining, windowSeconds: windowMs / 1000,
    nextAvailableAt, retryAfterSeconds: nextAvailableAt ? Math.max(1, Math.ceil((nextAvailableAt - now) / 1000)) : 0,
    isGuest: guest, windowDurationSeconds: windowMs / 1000, nextAvailableScanTimestamp: nextAvailableAt };
}
// One UID document serializes admission across instances. No disk or memory fallback.
export class ScanStore {
  constructor(private db: Firestore, private clock = Date.now) {}
  private user(uid: string) { return this.db.collection('scanAccounts').doc(uid); }
  private operation(uid: string, key: string) {
    return this.user(uid).collection('operations').doc(createHash('sha256').update(key).digest('hex'));
  }
  async inspect(identity: Identity) {
    const snapshot = await this.user(identity.uid).get();
    return quotaStatus(snapshot.data()?.events || [], identity.isGuest, this.clock());
  }
  async reserve(identity: Identity, key: string, hash: string) {
    const user = this.user(identity.uid), op = this.operation(identity.uid, key);
    return this.db.runTransaction(async tx => {
      const [account, previous] = await tx.getAll(user, op);
      const now = this.clock();
      const events: Event[] = (account.data()?.events || []).filter((e: Event) => e.at > now - GUEST_WINDOW_MS);
      const quota = quotaStatus(events, identity.isGuest, now);
      if (previous.exists) {
        const data = previous.data()!;
        if (data.hash !== hash) throw new ApiError(409, 'idempotency_conflict', 'This request key belongs to a different image.');
        if (data.state === 'pending' && now - data.createdAt >= 120000) {
          const response = { status: 'error', code: 'scan_interrupted', error: 'This scan was interrupted. Start a new scan.', quota };
          tx.update(op, { state: 'complete', response, status: 504 });
          return { id: op.id, quota, replay: response, status: 504 };
        }
        if (data.state === 'pending') throw new ApiError(409, 'scan_in_progress', 'This scan is still processing. Retry with the same request key.');
        return { id: op.id, quota, replay: data.response, status: data.status as number };
      }
      if (!quota.allowed) return { id: op.id, quota, status: 429, replay: null };
      events.push({ id: op.id, at: now });
      tx.set(user, { events }, { merge: true });
      tx.create(op, { hash, state: 'pending', createdAt: now });
      return { id: op.id, quota: quotaStatus(events, identity.isGuest, now), replay: null, status: 202 };
    });
  }
  async finish(identity: Identity, key: string, response: Record<string, unknown>, status: number) {
    const user = this.user(identity.uid), op = this.operation(identity.uid, key);
    return this.db.runTransaction(async tx => {
      const [account, operation] = await tx.getAll(user, op);
      if (operation.data()?.state !== 'pending') throw new ApiError(409, 'operation_completed', 'This scan has already completed.');
      // Accepted expensive work counts even on failure, preventing retry-based spending abuse.
      const quota = quotaStatus(account.data()?.events || [], identity.isGuest, this.clock());
      const completed = JSON.parse(JSON.stringify({ ...response, quota }));
      tx.update(op, { state: 'complete', response: completed, status });
      if (status === 200) {
        tx.create(user.collection('history').doc(op.id), { id: op.id, timestamp: operation.data()!.createdAt,
          schemaVersion: 1, productName: response.productName, brand: response.brand,
          rating: response.rating, novaGroup: response.novaGroup, data: completed });
        tx.set(user, { totalScans: (account.data()?.totalScans || 0) + 1 }, { merge: true });
      }
      return completed;
    });
  }
}
export function getScanStore() {
  if (!adminDb) throw new ApiError(503, 'store_unavailable', 'Scan storage is temporarily unavailable.');
  return new ScanStore(adminDb);
}

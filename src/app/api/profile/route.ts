import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { authenticate, checkOrigin, readJson } from '@/lib/request';
import { apiFailure } from '@/lib/scan-service';
import { ApiError } from '@/lib/api-error';
export const dynamic = 'force-dynamic';
const profileSchema = z.object({ name: z.string().trim().min(1).max(80).optional(), handle: z.string().regex(/^[a-z0-9_]{3,20}$/).optional(), allergens: z.array(z.string().trim().min(1).max(40)).max(20).optional() }).strict();
export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!adminDb) throw new ApiError(503, 'store_unavailable', 'Profile storage is unavailable.');
    const record = await adminDb.collection('profiles').doc(identity.uid).get();
    return NextResponse.json({ profile: record.data() || {}, uid: identity.uid, isGuest: identity.isGuest }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiFailure(error, randomUUID()); }
}
export async function PATCH(request: NextRequest) {
  try {
    checkOrigin(request);
    const identity = await authenticate(request);
    if (!adminDb) throw new ApiError(503, 'store_unavailable', 'Profile storage is unavailable.');
    const parsed = profileSchema.safeParse(await readJson(request, 4096));
    if (!parsed.success) throw new ApiError(400, 'invalid_profile', 'Check your name, handle and allergen choices.');
    const ref = adminDb.collection('profiles').doc(identity.uid);
    await adminDb.runTransaction(async tx => {
      const old = await tx.get(ref);
      const handle = parsed.data.handle;
      const claim = handle ? adminDb!.collection('handles').doc(handle) : null;
      const existing = claim ? await tx.get(claim) : null;
      if (existing?.exists && existing.data()?.uid !== identity.uid) throw new ApiError(409, 'handle_taken', 'That handle is already in use.');
      if (claim) {
        tx.set(claim, { uid: identity.uid });
        if (old.data()?.handle && old.data()?.handle !== handle) tx.delete(adminDb!.collection('handles').doc(old.data()!.handle));
      }
      tx.set(ref, { ...parsed.data, createdAt: old.data()?.createdAt || Date.now() }, { merge: true });
    });
    return NextResponse.json({ status: 'success', profile: parsed.data });
  } catch (error) { return apiFailure(error, randomUUID()); }
}

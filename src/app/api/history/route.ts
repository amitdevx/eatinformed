import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldPath } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { authenticate, checkOrigin } from '@/lib/request';
import { apiFailure } from '@/lib/scan-service';
import { ApiError } from '@/lib/api-error';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const identity = await authenticate(request);
    if (!adminDb) throw new ApiError(503, 'store_unavailable', 'History is temporarily unavailable.');
    const user = adminDb.collection('scanAccounts').doc(identity.uid);
    let query = user.collection('history').orderBy('timestamp', 'desc').orderBy(FieldPath.documentId(), 'desc').limit(100);
    const cursor = request.nextUrl.searchParams.get('cursor');
    if (cursor) {
      if (!/^[a-f0-9]{64}$/.test(cursor)) throw new ApiError(400, 'invalid_cursor', 'Invalid history cursor.');
      const last = await user.collection('history').doc(cursor).get();
      if (!last.exists) throw new ApiError(400, 'invalid_cursor', 'History changed. Refresh the list.');
      query = query.startAfter(last);
    }
    const [records, account] = await Promise.all([query.get(), user.get()]);
    return NextResponse.json({ items: records.docs.map(d => d.data()), totalScans: account.data()?.totalScans || 0,
      nextCursor: records.size === 100 ? records.docs[99].id : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiFailure(error, randomUUID()); }
}
export async function DELETE(request: NextRequest) {
  try {
    checkOrigin(request);
    const identity = await authenticate(request);
    if (!adminDb) throw new ApiError(503, 'store_unavailable', 'History is temporarily unavailable.');
    const id = request.nextUrl.searchParams.get('id');
    if (!id || !/^[a-f0-9]{64}$/.test(id)) throw new ApiError(400, 'invalid_id', 'Choose a valid scan record.');
    const user = adminDb.collection('scanAccounts').doc(identity.uid);
    await adminDb.runTransaction(async tx => {
      const ref = user.collection('history').doc(id);
      const [record, account] = await tx.getAll(ref, user);
      if (!record.exists) throw new ApiError(404, 'not_found', 'Scan record not found.');
      tx.delete(ref);
      // Remove retained product data from replay storage but keep the key tombstone.
      tx.update(user.collection('operations').doc(id), { response: { status: 'error', code: 'scan_deleted', error: 'This scan was deleted.' }, status: 410 });
      tx.set(user, { totalScans: Math.max(0, (account.data()?.totalScans || 0) - 1) }, { merge: true });
    });
    return NextResponse.json({ status: 'success' });
  } catch (error) { return apiFailure(error, randomUUID()); }
}

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/request';
import { getScanStore } from '@/lib/quota';
import { apiFailure, createScanHandler } from '@/lib/scan-service';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const POST = createScanHandler();
export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    if (request.nextUrl.searchParams.get('quota') === 'true') {
      const identity = await authenticate(request);
      return NextResponse.json({ status: 'success', quota: await getScanStore().inspect(identity), requestId }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ status: 'ok', kind: 'liveness', requestId });
  } catch (error) { return apiFailure(error, requestId); }
}

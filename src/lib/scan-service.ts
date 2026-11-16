import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate, checkOrigin, readJson } from './request';
import { ApiError } from './api-error';
import { getScanStore } from './quota';
import { validateImagePayload } from './image-validation';
import { adminDb } from './firebase-admin';
import { preferenceWarnings } from './allergens';
import { isNimConfigured } from '@/ai/nim';
import { ProductAnalysisOutputSchema } from '@/ai/flows/product-analysis-types';
import { analyzeProduct } from '@/ai/flows/product-analysis';

export function apiFailure(error: unknown, requestId: string) {
  const known = error instanceof ApiError;
  return NextResponse.json({ status: 'error', schemaVersion: 1, requestId,
    code: known ? error.code : 'internal_error',
    error: known ? error.message : 'The service could not complete this request. Please try again.' },
    { status: known ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}

// Dependencies are supplied only in isolated tests, never selected from a request.
export function createScanHandler(analyze = analyzeProduct) {
  return async (request: NextRequest) => {
    const requestId = randomUUID(), started = Date.now();
    let stage = 'authentication';
    try {
      checkOrigin(request);
      const identity = await authenticate(request);
      stage = 'validation';
      const parsed = z.object({ image: z.string() }).strict().safeParse(await readJson(request));
      if (!parsed.success) throw new ApiError(400, 'invalid_input', 'Provide exactly one image.');
      const key = request.headers.get('idempotency-key');
      if (!key || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) throw new ApiError(400, 'invalid_idempotency_key', 'A valid Idempotency-Key is required.');
      const image = await validateImagePayload(parsed.data.image);
      if (!image.valid) throw new ApiError(image.httpStatus || 400, image.code || 'invalid_image', image.error || 'Invalid image.');
      if (analyze === analyzeProduct && !isNimConfigured()) throw new ApiError(503, 'ai_offline', 'Food analysis is temporarily unavailable.');
      stage = 'quota';
      const store = getScanStore();
      const reservation = await store.reserve(identity, key, createHash('sha256').update(parsed.data.image).digest('hex'));
      if (reservation.replay) return NextResponse.json({ ...reservation.replay, quota: reservation.quota, requestId, idempotentReplay: true }, { status: reservation.status, headers: { 'Cache-Control': 'no-store' } });
      if (reservation.status === 429) return NextResponse.json({ status: 'error', code: 'quota_limit_reached', error: 'Your scan allowance is exhausted. Please wait before trying again.', requestId, quota: reservation.quota, ...reservation.quota }, { status: 429, headers: { 'Retry-After': String(reservation.quota.retryAfterSeconds), 'Cache-Control': 'no-store' } });
      stage = 'analysis';
      let result: Record<string, unknown>, status = 200;
      try {
        const validated = ProductAnalysisOutputSchema.safeParse(await analyze(image.normalized!));
        if (!validated.success) throw new ApiError(502, 'invalid_ai_output', 'The analysis response was invalid.');
        const analysis = validated.data;
        if (analysis.status !== 'success') throw new ApiError(422, analysis.status === 'unreadable' ? 'label_unreadable' : 'no_food_data', 'No readable ingredients or nutrition panel were found. Try a clearer label photo.');
        const profile = await adminDb!.collection('profiles').doc(identity.uid).get();
        analysis.warnings = [...analysis.warnings, ...preferenceWarnings(analysis.ingredients, profile.data()?.allergens || [])];
        result = { ...analysis, schemaVersion: 1, scanId: reservation.id, requestId };
      } catch (error) {
        const failure = apiFailure(error, requestId);
        status = failure.status;
        result = await failure.json();
      }
      stage = 'persistence';
      const completed = await store.finish(identity, key, result, status);
      console.info(JSON.stringify({ event: 'scan_complete', requestId, status, durationMs: Date.now() - started }));
      return NextResponse.json(completed, { status, headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.warn(JSON.stringify({ event: 'scan_failed', requestId, stage, code: error instanceof ApiError ? error.code : 'internal_error', durationMs: Date.now() - started }));
      return apiFailure(error, requestId);
    }
  };
}

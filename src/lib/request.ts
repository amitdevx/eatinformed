import { NextRequest } from 'next/server';
import { ApiError } from './api-error';
import { adminAuth } from './firebase-admin';
export interface Identity { uid: string; isGuest: boolean }

export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_ORIGIN || request.nextUrl.origin;
  if ((origin && origin !== expected) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ApiError(403, 'origin_denied', 'This request origin is not permitted.');
  }
}
export async function authenticate(request: NextRequest): Promise<Identity> {
  const authorization = request.headers.get('authorization');
  const cookie = request.cookies.get('session')?.value;
  if (!authorization && !cookie) throw new ApiError(401, 'auth_required', 'Please sign in to continue.');
  if (!adminAuth) throw new ApiError(503, 'auth_unavailable', 'Authentication is temporarily unavailable.');
  if (!authorization) checkOrigin(request);
  try {
    const claims = authorization
      ? await adminAuth.verifyIdToken(/^Bearer ([^\s]+)$/i.exec(authorization)?.[1] || '', true)
      : await adminAuth.verifySessionCookie(cookie!, true);
    return { uid: claims.uid, isGuest: claims.firebase?.sign_in_provider === 'anonymous' };
  } catch {
    throw new ApiError(401, 'invalid_credentials', 'Your session is invalid or expired. Please sign in again.');
  }
}
export async function readJson(request: NextRequest, limit = 4 * 1024 * 1024): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new ApiError(415, 'unsupported_media', 'Send an application/json request.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'invalid_json', 'A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ApiError(413, 'payload_too_large', 'The upload is too large. Choose a smaller image.');
      }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new ApiError(400, 'invalid_json', 'The request body is not valid JSON.'); }
  } finally { reader.releaseLock(); }
}

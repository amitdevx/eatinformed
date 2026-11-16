import { randomUUID, createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { authenticate, checkOrigin, readJson } from '@/lib/request';
import { ApiError } from '@/lib/api-error';
import { apiFailure } from '@/lib/scan-service';

type Context = { params: Promise<{ action?: string[] }> };
const mobileSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('guest') }).strict(),
  z.object({ type: z.enum(['signIn', 'signUp']), email: z.string().email().max(254), password: z.string().min(6).max(256) }).strict(),
  z.object({ type: z.literal('refresh'), refreshToken: z.string().min(1).max(8192) }).strict(),
  z.object({ type: z.literal('link'), email: z.string().email().max(254), password: z.string().min(6).max(256), idToken: z.string().min(1).max(8192) }).strict(),
]);
export async function POST(request: NextRequest, context: Context) {
  const requestId = randomUUID();
  try {
    checkOrigin(request);
    const { action } = await context.params;
    if (action?.length !== 1) throw new ApiError(404, 'not_found', 'Not found.');
    if (action[0] === 'logout') {
      const response = NextResponse.json({ status: 'success' });
      response.cookies.set('session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      return response;
    }
    if (!adminAuth) throw new ApiError(503, 'auth_unavailable', 'Authentication is temporarily unavailable.');
    let body = await readJson(request, 16384);
    if (action[0] === 'bridge') {
      if (!adminDb) throw new ApiError(503, 'store_unavailable', 'Sign-in is temporarily unavailable.');
      const create = z.object({ mode: z.literal('create'), idToken: z.string().max(8192), refreshToken: z.string().max(8192), challenge: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(body);
      if (create.success) {
        const claims = await adminAuth.verifyIdToken(create.data.idToken, true);
        const code = randomUUID();
        await adminDb.collection('authExchanges').doc(code).create({ uid: claims.uid, refreshToken: create.data.refreshToken, challenge: create.data.challenge, expiresAt: Date.now() + 60000 });
        return NextResponse.json({ code }, { headers: { 'Cache-Control': 'no-store' } });
      }
      const exchange = z.object({ mode: z.literal('exchange'), code: z.string().uuid(), verifier: z.string().min(32).max(128) }).strict().safeParse(body);
      if (!exchange.success) throw new ApiError(400, 'invalid_exchange', 'Invalid sign-in exchange.');
      const ref = adminDb.collection('authExchanges').doc(exchange.data.code);
      const refreshToken = await adminDb.runTransaction(async tx => {
        const record = await tx.get(ref), data = record.data();
        if (!data || data.expiresAt < Date.now() || data.challenge !== createHash('sha256').update(exchange.data.verifier).digest('hex')) throw new ApiError(401, 'invalid_exchange', 'Sign-in expired. Please try again.');
        tx.delete(ref);
        return data.refreshToken;
      });
      body = { type: 'refresh', refreshToken };
    }
    if (action[0] === 'login') {
      const input = z.object({ idToken: z.string().min(1).max(8192) }).strict().safeParse(body);
      if (!input.success) throw new ApiError(400, 'invalid_input', 'A Firebase ID token is required.');
      let claims;
      try { claims = await adminAuth.verifyIdToken(input.data.idToken, true); }
      catch { throw new ApiError(401, 'invalid_credentials', 'Please sign in again.'); }
      if (Date.now() / 1000 - claims.auth_time > 300) throw new ApiError(401, 'recent_login_required', 'Please sign in again.');
      const expiresIn = 14 * 86400000;
      const session = await adminAuth.createSessionCookie(input.data.idToken, { expiresIn });
      const response = NextResponse.json({ status: 'success' });
      response.cookies.set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: expiresIn / 1000 });
      return response;
    }
    if (action[0] !== 'mobile' && action[0] !== 'bridge') throw new ApiError(404, 'not_found', 'Not found.');
    const input = mobileSchema.safeParse(body);
    if (!input.success) throw new ApiError(400, 'invalid_input', 'Check the authentication details and try again.');
    const data = input.data;
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!key) throw new ApiError(503, 'auth_unavailable', 'Authentication is temporarily unavailable.');
    if (data.type === 'link') {
      const identity = await authenticate(request);
      const claims = await adminAuth.verifyIdToken(data.idToken, true);
      if (!identity.isGuest || claims.uid !== identity.uid) throw new ApiError(403, 'link_denied', 'Only your own guest account can be upgraded.');
    }
    const refresh = data.type === 'refresh';
    const emulator = process.env.NODE_ENV !== 'production' ? process.env.FIREBASE_AUTH_EMULATOR_HOST : undefined;
    const base = emulator ? `http://${emulator}/identitytoolkit.googleapis.com/v1` : 'https://identitytoolkit.googleapis.com/v1';
    const secureBase = emulator ? `http://${emulator}/securetoken.googleapis.com/v1` : 'https://securetoken.googleapis.com/v1';
    const endpoint = refresh ? `${secureBase}/token` : `${base}/accounts:${data.type === 'signIn' ? 'signInWithPassword' : data.type === 'link' ? 'update' : 'signUp'}`;
    const payload = refresh ? { grant_type: 'refresh_token', refresh_token: data.refreshToken }
      : data.type === 'guest' ? { returnSecureToken: true }
      : { email: data.email, password: data.password, returnSecureToken: true, ...(data.type === 'link' ? { idToken: data.idToken } : {}) };
    const upstream = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
    const result = await upstream.json();
    if (!upstream.ok) {
      const providerCode = String(result.error?.message || 'UNKNOWN').split(' : ')[0];
      console.warn(JSON.stringify({ event: 'auth_provider_failure', requestId, status: upstream.status, code: providerCode }));
      if (['OPERATION_NOT_ALLOWED', 'ADMIN_ONLY_OPERATION', 'CONFIGURATION_NOT_FOUND', 'API_KEY_INVALID', 'INVALID_API_KEY', 'PROJECT_NOT_FOUND'].includes(providerCode)) throw new ApiError(503, 'auth_provider_configuration', 'This sign-in method is unavailable. Please contact support.');
      const conflict = result.error?.message === 'EMAIL_EXISTS';
      throw new ApiError(conflict ? 409 : upstream.status === 429 ? 429 : 401, conflict ? 'account_exists' : 'authentication_failed', conflict ? 'This account already exists. Sign in to it; guest records will remain separate.' : 'Authentication failed. Check your details or try again later.');
    }
    const token = result.idToken || result.id_token;
    const claims = await adminAuth.verifyIdToken(token, true);
    const user = await adminAuth.getUser(claims.uid);
    const profile = adminDb ? await adminDb.collection('profiles').doc(claims.uid).get().then(record => record.data()).catch(() => undefined) : undefined;
    return NextResponse.json({ status: 'success', token, refreshToken: result.refreshToken || result.refresh_token,
      expiresAt: Date.now() + Number(result.expiresIn || result.expires_in || 3600) * 1000,
      user: { uid: claims.uid, email: user.email || '', name: profile?.name || user.displayName || user.email?.split('@')[0] || 'Guest Explorer', isAnonymous: claims.firebase?.sign_in_provider === 'anonymous', photoUrl: user.photoURL || null, handle: profile?.handle, allergens: profile?.allergens || [] } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'auth_request_failed', requestId, code: error instanceof ApiError ? error.code : 'internal_error', status: error instanceof ApiError ? error.status : 500 }));
    return apiFailure(error, requestId);
  }
}

// Public capability check; does not disclose project identifiers or credentials.
export async function GET(_request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (action?.length !== 1 || action[0] !== 'status') return NextResponse.json({ code: 'not_found' }, { status: 404 });
  const configured = Boolean(adminAuth && (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY));
  return NextResponse.json({ status: configured ? 'configured' : 'unavailable' }, { status: configured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

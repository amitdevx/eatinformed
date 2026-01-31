
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'session';

// Define cookie options with proper security settings
const getCookieOptions = (expires: number) => ({
  name: SESSION_COOKIE_NAME,
  value: '',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  expires,
});

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = getCookieOptions(Date.now() + expiresIn);
    options.value = sessionCookie;

        const cookieStore = await cookies();
    cookieStore.set(options.name, options.value, options);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Session login error:', error);
    let errorMessage = 'An unexpected error occurred.';
    // Check for Firebase Auth error codes
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      if (errorCode === 'auth/id-token-revoked') {
        errorMessage = 'The ID token has been revoked. Please re-authenticate.';
      } else if (errorCode === 'auth/argument-error') {
        errorMessage = 'Invalid ID token provided.';
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}

export async function GET(_request: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) {
      // It's good practice to verify the cookie before revoking tokens
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      }
    }

    const options = getCookieOptions(0); // Expire the cookie immediately
    cookieStore.set(options.name, '', options);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: 'Failed to log out.' }, { status: 500 });
  }
}

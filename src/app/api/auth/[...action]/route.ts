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

type RouteContext = {
  params: Promise<{ action?: string[] } | any>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const currentAction = action?.[0];

  // ponytail: support mobile and web client authentication
  if (currentAction === 'mobile') {
    try {
      const body = await request.json();
      const { email, password, type = 'signIn' } = body;
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

      if (type === 'guest') {
        if (apiKey) {
          try {
            const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ returnSecureToken: true }),
            });
            const fbData = await fbRes.json();
            if (fbRes.ok && fbData.idToken) {
              const token = adminAuth
                ? await adminAuth.createSessionCookie(fbData.idToken, { expiresIn: 60 * 60 * 24 * 14 * 1000 }).catch(() => fbData.idToken)
                : fbData.idToken;
              return NextResponse.json({
                status: 'success',
                token,
                user: { email: '', name: 'Guest Explorer', isAnonymous: true },
              });
            }
          } catch (e) {
            console.warn('Firebase guest creation failed, using local session:', e);
          }
        }

        return NextResponse.json({
          status: 'success',
          token: `guest_token_${Date.now()}`,
          user: { email: '', name: 'Guest Explorer', isAnonymous: true },
        });
      }

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      if (!apiKey) {
        return NextResponse.json(
          { error: 'Authentication service is not configured on the server (missing FIREBASE_API_KEY).' },
          { status: 503 }
        );
      }

      const endpoint = type === 'signUp'
        ? `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`
        : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      const fbRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const fbData = await fbRes.json();
      if (!fbRes.ok) {
        const rawMsg = fbData.error?.message || 'Authentication failed';
        const cleanMsg = rawMsg.replace(/_/g, ' ').toLowerCase();
        return NextResponse.json(
          { error: cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1) },
          { status: 400 }
        );
      }

      const token = adminAuth
        ? await adminAuth.createSessionCookie(fbData.idToken, { expiresIn: 60 * 60 * 24 * 14 * 1000 }).catch(() => fbData.idToken)
        : fbData.idToken;

      return NextResponse.json({
        status: 'success',
        token,
        user: {
          email: fbData.email || email,
          name: fbData.displayName || email.split('@')[0],
          isAnonymous: false,
        },
      });
    } catch (err: unknown) {
      console.error('Mobile auth error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Authentication failed' }, { status: 500 });
    }
  }

  if (currentAction === 'logout') {
    return handleLogout();
  }

  if (!adminAuth) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  if (currentAction === 'login') {
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

      return NextResponse.json({ status: 'success', token: sessionCookie }, { status: 200 });
    } catch (error: unknown) {
      console.error('Session login error:', error);
      let errorMessage = 'An unexpected error occurred.';
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

  if (currentAction === 'logout') {
    return handleLogout();
  }

  return NextResponse.json({ error: `Unsupported action: ${currentAction}` }, { status: 404 });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const currentAction = action?.[0];

  if (currentAction === 'logout') {
    return handleLogout();
  }

  return NextResponse.json({ error: `Not found` }, { status: 404 });
}

async function handleLogout() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (adminAuth && sessionCookie) {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub).catch(() => null);
      }
    }

    const options = getCookieOptions(0);
    cookieStore.set(options.name, '', options);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

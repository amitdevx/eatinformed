'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

function MobileAuthContent() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect_uri') || 'eatinformed://auth/callback';
  const redirectUri = decodeURIComponent(rawRedirect);

  const [status, setStatus] = useState<'loading' | 'signing_in' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startGoogleSignIn = async () => {
    if (!auth) {
      setStatus('error');
      setErrorMessage('Authentication service is not configured on the server.');
      return;
    }

    setStatus('signing_in');
    setErrorMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const email = user.email || '';
      const name = user.displayName || email.split('@')[0] || 'Member';
      const photoUrl = user.photoURL || '';

      setStatus('success');

      // Hand off token and credentials back to the mobile app deep link
      const delimiter = redirectUri.includes('?') ? '&' : '?';
      const callbackUrl = `${redirectUri}${delimiter}token=${encodeURIComponent(idToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&photoUrl=${encodeURIComponent(photoUrl)}`;

      window.location.replace(callbackUrl);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        const delimiter = redirectUri.includes('?') ? '&' : '?';
        window.location.replace(`${redirectUri}${delimiter}error=cancelled`);
        return;
      }
      setStatus('error');
      setErrorMessage(err?.message || 'Google authentication failed. Please try again.');
    }
  };

  useEffect(() => {
    startGoogleSignIn();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-2">EatInformed Sign In</h1>
        <p className="text-sm text-zinc-400 mb-6">
          {status === 'signing_in' || status === 'loading'
            ? 'Completing secure Google authentication for your mobile app...'
            : status === 'success'
            ? 'Redirecting back to EatInformed app...'
            : 'Authentication paused.'}
        </p>

        {status === 'error' && (
          <div className="w-full bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 mb-5 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {status === 'signing_in' || status === 'loading' || status === 'success' ? (
          <div className="flex items-center gap-3 text-emerald-400 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{status === 'success' ? 'Authenticated! Opening app...' : 'Connecting to Google...'}</span>
          </div>
        ) : (
          <button
            onClick={startGoogleSignIn}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-black font-semibold rounded-xl text-sm"
          >
            Continue with Google
          </button>
        )}
      </div>
    </div>
  );
}

export default function MobileAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white text-sm">Loading...</div>}>
      <MobileAuthContent />
    </Suspense>
  );
}

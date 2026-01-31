
'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfileDocument } from '@/utils/authActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.636,44,29.8,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

interface AuthFormProps {
    onAuthSuccess: () => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleAuthSuccess = async (idToken: string) => {
    // Call the API route to set the session cookie
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    onAuthSuccess();
  };

  const handleAuthAction = async (action: 'signUp' | 'signIn') => {
    if (!auth) {
      setError("Firebase is not configured. Please check your environment variables.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      // Set persistence to 'local' to survive browser restarts
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = action === 'signUp'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      
      await createUserProfileDocument(userCredential.user);
      const idToken = await userCredential.user.getIdToken();
      
      toast({
        title: action === 'signUp' ? 'Account Created!' : 'Signed In!',
        description: 'You have been successfully logged in.',
      });
      await handleAuthSuccess(idToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Firebase is not configured. Please check your environment variables.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Set persistence to 'local' to survive browser restarts
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      
      await createUserProfileDocument(result.user);
      const idToken = await result.user.getIdToken();
      
      toast({
        title: 'Signed In with Google!',
        description: 'You have been successfully logged in.',
      });
      await handleAuthSuccess(idToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during Google Sign-In.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!auth) {
      setError("Firebase is not configured. Please check your environment variables.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInAnonymously(auth);
      
      await createUserProfileDocument(result.user);
      const idToken = await result.user.getIdToken();
      
      toast({
        title: 'Signed in as Guest',
        description: 'Your progress will be saved for this session.',
      });
      await handleAuthSuccess(idToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during Guest Sign-In.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <div className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isProcessing}>
                {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-5 w-5" />
                )}
                Continue with Google
            </Button>
            
            <Button 
              variant="ghost" 
              className="border border-dashed border-white/20 hover:bg-white/5"
              onClick={handleAnonymousSignIn} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="text-sm font-medium">Continue as Guest</span>
              )}
            </Button>
            </div>
            <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email-auth">Email</Label>
                <Input id="email-auth" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isProcessing} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password-auth">Password</Label>
                <Input id="password-auth" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isProcessing} />
                </div>
            </div>
        </div>

        {error && (
            <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="mt-6">
            {activeTab === 'login' ? (
                <Button className="w-full" onClick={() => handleAuthAction('signIn')} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            ) : (
                <Button className="w-full" onClick={() => handleAuthAction('signUp')} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            )}
        </div>
    </Tabs>
  );
}

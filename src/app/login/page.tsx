
'use client';

import { AuthForm } from '@/components/features/AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EatInformedLogo } from '@/components/icons/NutriScanLogo';
import Link from 'next/link';

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/check');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center py-12 px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex flex-col items-center gap-2 group" aria-label="EatInformed Home">
            <EatInformedLogo width={36} height={36} />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">EatInformed</h1>
          </Link>
        </div>
        
        <Card className="bg-card border-border shadow-sm rounded-3xl p-6 sm:p-8">
          <CardHeader className="text-center space-y-1.5 pb-6 pt-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              <AuthForm initialTab="login" onAuthSuccess={() => router.push('/check')} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

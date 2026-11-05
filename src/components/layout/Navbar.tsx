'use client';

import Link from 'next/link';
import { EatInformedLogo } from '@/components/icons/NutriScanLogo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, User as UserIcon, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AuthForm } from '../features/AuthForm';

const navItems = [
  { href: '/product', label: 'Product' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/support', label: 'Support' },
];

const AuthButton = ({ isMobile = false }) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'GET' });
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
    );
  }

  if (user) {
    const displayName = userProfile?.name || user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest' : 'User');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 border border-white/10">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={displayName} />
              <AvatarFallback className="bg-[#1C1C1E] text-[#F5F5F7] text-xs">
                {displayName.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#161618] border-white/10 text-[#F5F5F7] rounded-2xl" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-[#86868B]">
                {user.email || (user.isAnonymous ? 'Guest Session' : '')}
              </p>
              {user.isAnonymous && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 w-fit mt-1">
                  Guest Mode
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={() => router.push('/check')} className="cursor-pointer hover:bg-white/5 rounded-xl">
             <UserIcon className="mr-2 h-4 w-4 text-[#86868B]" />
             <span>Scanner</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-rose-400 hover:bg-rose-500/10 rounded-xl">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
        <Button
          onClick={() => setOpenAuthDialog(true)}
          className={cn(
            isMobile ? 'w-full' : 'hidden md:inline-flex',
            'bg-[#F5F5F7] hover:bg-white text-[#000000] rounded-full text-xs font-semibold px-4 py-2 transition-all duration-150 active:scale-[0.98]'
          )}
        >
          Sign in
        </Button>
        <DialogContent className="max-w-md bg-[#161618] border-white/10 text-[#F5F5F7] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold tracking-tight">EatInformed</DialogTitle>
            <DialogDescription className="text-center text-xs text-[#86868B]">
              Sign in or create an account for persistent nutrition history.
            </DialogDescription>
          </DialogHeader>
          <AuthForm onAuthSuccess={() => {
            setOpenAuthDialog(false);
            router.push('/check');
          }} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-200">
      <div
        className={cn(
          'w-full transition-all duration-200',
          isScrolled
            ? 'bg-black/75 backdrop-blur-xl border-b border-white/[0.08] shadow-sm'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="container mx-auto px-6 h-14 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center space-x-2.5 group" aria-label="EatInformed Home">
            <EatInformedLogo width={24} height={24} />
            <span className="font-semibold text-sm tracking-tight text-[#F5F5F7] group-hover:text-white transition-colors">
              EatInformed
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'transition-colors duration-150',
                    isActive
                      ? 'text-[#F5F5F7] font-semibold'
                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <AuthButton />

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-full h-8 w-8 text-[#86868B] hover:text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-[#161618] border-l border-white/[0.08] p-6 text-[#F5F5F7]">
                  <div className="flex flex-col h-full">
                    <Link href="/" className="flex items-center space-x-2.5 mb-8" aria-label="EatInformed Home">
                      <SheetClose asChild>
                        <div className="flex items-center space-x-2">
                          <EatInformedLogo width={24} height={24} />
                          <span className="font-semibold text-sm text-[#F5F5F7]">EatInformed</span>
                        </div>
                      </SheetClose>
                    </Link>

                    <div className="flex flex-col space-y-4">
                      {navItems.map((item) => (
                        <SheetClose asChild key={`mobile-${item.href}`}>
                          <Link
                            href={item.href}
                            className={cn(
                              'text-sm font-medium py-1 transition-colors',
                              pathname === item.href ? 'text-[#30D158]' : 'text-[#86868B] hover:text-[#F5F5F7]'
                            )}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/[0.08]">
                      <AuthButton isMobile={true} />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

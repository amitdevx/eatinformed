'use client';

import Link from 'next/link';
import { EatInformedLogo } from '@/components/icons/NutriScanLogo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};

const AuthButton = ({ isMobile = false, onAction }: { isMobile?: boolean; onAction?: () => void }) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);

  const handleSignOut = async () => {
    onAction?.();
    if (auth) {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'GET' });
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  if (user) {
    const displayName = userProfile?.name || user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest' : 'User');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 border border-border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={displayName} />
              <AvatarFallback className="bg-card text-foreground text-xs">
                {displayName.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border text-foreground rounded-2xl" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email || (user.isAnonymous ? 'Guest Session' : '')}
              </p>
              {user.isAnonymous && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 w-fit mt-1">
                  Guest Mode
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={() => { onAction?.(); router.push('/check'); }} className="cursor-pointer hover:bg-muted rounded-xl">
             <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
             <span>Scanner</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive hover:bg-destructive/10 rounded-xl">
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
            'bg-foreground hover:bg-foreground/90 text-background rounded-full text-xs font-semibold px-4 py-2 transition-all active:scale-[0.98]'
          )}
        >
          Sign in
        </Button>
        <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold tracking-tight">EatInformed</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Sign in or continue as guest for instant product scanning.
            </DialogDescription>
          </DialogHeader>
          <AuthForm onAuthSuccess={() => {
            setOpenAuthDialog(false);
            onAction?.();
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
  const [mobileOpen, setMobileOpen] = useState(false);

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
            ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="container mx-auto px-6 h-14 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center space-x-2.5 group" aria-label="EatInformed Home">
            <EatInformedLogo width={24} height={24} />
            <span className="font-semibold text-sm tracking-tight text-foreground">
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
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <AuthButton />

            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-card border-l border-border p-6 text-foreground">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <Link href="/" className="flex items-center space-x-2" aria-label="EatInformed Home" onClick={() => setMobileOpen(false)}>
                        <SheetClose asChild>
                          <div className="flex items-center space-x-2">
                            <EatInformedLogo width={24} height={24} />
                            <span className="font-semibold text-sm text-foreground">EatInformed</span>
                          </div>
                        </SheetClose>
                      </Link>
                      <ThemeToggle />
                    </div>

                    <div className="flex flex-col space-y-4">
                      {navItems.map((item) => (
                        <SheetClose asChild key={`mobile-${item.href}`}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'text-sm font-medium py-1 transition-colors',
                              pathname === item.href ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-border">
                      <AuthButton isMobile={true} onAction={() => setMobileOpen(false)} />
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

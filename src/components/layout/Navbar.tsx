
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
      <Button variant="ghost" className="rounded-full" size="icon">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </Button>
    );
  }

  // ponytail: render avatar if user is authenticated; don't flash login button if profile is pending
  if (user) {
    const displayName = userProfile?.name || user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest' : 'User');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL ?? ''} alt={displayName} />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase() || <UserIcon />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email || (user.isAnonymous ? 'Anonymous Session' : '')}
              </p>
              {user.isAnonymous && (
                <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-500 w-fit mt-2">
                  Guest Mode
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/check')}>
             <UserIcon className="mr-2 h-4 w-4" />
             <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Auth Dialog Trigger & Content
  return (
    <>
      <Dialog open={openAuthDialog} onOpenChange={setOpenAuthDialog}>
        <Button onClick={() => setOpenAuthDialog(true)} className={cn(isMobile ? 'w-full' : 'hidden md:flex', 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/30')}>
          Login / Sign Up
        </Button>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="text-center text-2xl">Welcome to EatInformed</DialogTitle>
                <DialogDescription className="text-center">
                    Sign in or create an account to get started.
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 50);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-[95%] max-w-screen-xl",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-[150%] opacity-0"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-6 py-3 rounded-2xl border transition-all duration-300",
          isScrolled
            ? "bg-background/90 backdrop-blur-xl border-border/40 shadow-2xl shadow-primary/10"
            : "bg-background/40 backdrop-blur-md border-border/20 shadow-lg"
        )}
      >
        <Link href="/" className="flex items-center space-x-2 transform transition-transform duration-200 hover:scale-105" aria-label="EatInformed Home">
          <EatInformedLogo width={32} height={32} />
           <span className="font-bold text-lg hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">EatInformed</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 lg:gap-6 text-sm font-medium">
          {navItems.map((item, index) => {
             const isActive = pathname === item.href;
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 className={cn(
                   "relative text-foreground/80 hover:text-foreground transition-all duration-300 group px-3 py-1 rounded-lg hover:bg-foreground/5 transform hover:scale-110",
                   index % 2 === 0 ? "hover:rotate-1 hover:skew-x-1" : "hover:-rotate-1 hover:-skew-x-1",
                   isActive && "text-primary font-semibold bg-primary/10"
                 )}
               >
                 {item.label}
                 <span className={cn(
                   "absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary transition-all duration-200",
                   isActive ? "w-4" : "w-0 group-hover:w-4"
                 )}></span>
               </Link>
             );
          })}
        </nav>

        <div className="flex items-center space-x-2">
          <AuthButton />
          
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background/95 backdrop-blur-lg p-0 border-l border-white/10 shadow-2xl">
                <div className="flex flex-col h-full">
                  <div className="p-6">
                    <Link href="/" className="flex items-center space-x-2 mb-8" aria-label="EatInformed Home">
                      <SheetClose asChild>
                          <EatInformedLogo width={32} height={32} />
                      </SheetClose>
                      <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">EatInformed</span>
                    </Link>
                    <div className="flex flex-col space-y-2">
                      {navItems.map(item => (
                        <SheetClose asChild key={`mobile-${item.href}`}>
                            <Link
                              href={item.href}
                              className={cn(
                                "block rounded-xl p-3 transition-colors hover:bg-white/5 text-base relative overflow-hidden group",
                                pathname === item.href ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
                              )}
                            >
                              <span className="relative z-10">{item.label}</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                            </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto p-6">
                     <AuthButton isMobile={true} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

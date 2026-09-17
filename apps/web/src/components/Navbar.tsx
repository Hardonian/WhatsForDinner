'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useTenant } from '@/hooks/useTenant';
import {
  Home,
  ChefHat,
  Heart,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

import type { AppUser } from '@/types/user';

interface NavbarProps {
  user?: AppUser | null;
}

export default function Navbar({ user }: NavbarProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { tenant } = useTenant();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pantry', label: 'Pantry', icon: ChefHat },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const userNavItems = [
    { href: '/billing', label: 'Billing', icon: CreditCard },
    ...(tenant && tenant.plan !== 'free'
      ? [{ href: '/admin', label: 'Admin', icon: Settings }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-colors group-hover:bg-primary/90">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
              What's for Dinner?
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-1 md:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {user && (
              <>
                <Separator orientation="vertical" className="h-6" />
                {userNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="border-t bg-background md:hidden safe-area-inset-bottom"
            role="navigation"
            aria-label="Main navigation"
          >
            <div className="space-y-1 px-2 pb-safe-area-inset-bottom pt-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent active:text-foreground min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user && (
                <>
                  <Separator className="my-2" />
                  {userNavItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center space-x-3 rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:bg-accent active:text-foreground min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label={`Navigate to ${item.label}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              <Separator className="my-2" />

              {user ? (
                <div className="space-y-2 px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base font-medium text-foreground">
                      {user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground active:bg-destructive active:text-destructive-foreground min-h-[44px]"
                    aria-label="Sign out"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="block px-3 py-2"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Sign in"
                >
                  <Button className="w-full justify-start min-h-[44px]">
                    <User className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

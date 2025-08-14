"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Sparkles, Menu, LogIn, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { CURRENCIES } from '@/lib/currency';

interface ShoppingHeaderProps {
  currency: string;
  onCurrencyChange: (code: string) => void;
  plan: number;
  totalItems: number;
  onOpenPro: () => void;
  onNewCart?: () => void;
}

export function ShoppingHeader({
  currency,
  onCurrencyChange,
  plan,
  totalItems,
  onOpenPro,
  onNewCart,
}: ShoppingHeaderProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const isPro = isSignedIn && plan > 0;
  const showBecomePro = !isSignedIn || plan === 0;
  const router = useRouter();

  return (
    <div className="sticky top-0 z-50 w-full px-4 py-3">
      <div className="mx-auto">
        <div className="flex flex-row items-center justify-between gap-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-md px-4 py-3">
          {/* Mobile hamburger above title */}
          <div className="sm:hidden">
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-md border-gray-300 dark:border-slate-700" aria-label="Open settings">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-4">
                <SheetHeader>
                  <SheetTitle>Quick Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {isPro && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Carts</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full gap-2"
                          onClick={() => {
                            setIsMobileSheetOpen(false);
                            router.push('/carts');
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Go to Carts
                        </Button>
                        {typeof onNewCart === 'function' && (
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            disabled={totalItems === 0}
                            onClick={() => {
                              setIsMobileSheetOpen(false);
                              onNewCart();
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            New
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Currency</p>
                    <Select
                      value={currency}
                      onValueChange={(val) => {
                        onCurrencyChange(val);
                        setIsMobileSheetOpen(false);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
                    <ThemeToggle onChanged={() => setIsMobileSheetOpen(false)} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Pro</p>
                    {showBecomePro ? (
                      <Button
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                        onClick={() => {
                          setIsMobileSheetOpen(false);
                          onOpenPro();
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                        Become Pro
                      </Button>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white px-2 py-1 text-xs font-semibold">
                        You&#39;re Pro
                      </span>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 text-white shadow ring-1 ring-white/20">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-medium text-white shadow" aria-label={`Items in cart: ${totalItems}`}>
                    {totalItems}
                  </span>
                )}
              </span>
              <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="inline-block whitespace-nowrap text-xl sm:text-3xl font-semibold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-600 dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-200 bg-clip-text text-transparent">Quick Cart</h1>
                  {isPro && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide ring-1 ring-blue-300/60 shadow-sm transition duration-200 hover:ring-2 hover:ring-blue-300/70 hover:shadow">
                      <Sparkles className="h-3 w-3 mr-1 opacity-90" />
                      Pro
                    </span>
                  )}
                </div>
                <p className="hidden sm:block text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Add items and track your shopping expenses</p>
              </div>
            </Link>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
            {/* Desktop controls */}
            <div className="hidden sm:flex sm:items-center gap-2">
              <div className="w-40">
                <Select value={currency} onValueChange={onCurrencyChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-10">
                <ThemeToggle />
              </div>
              {isPro && (
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link href="/carts">
                    <ShoppingCart className="h-4 w-4" />
                    Carts
                  </Link>
                </Button>
              )}
              {isPro && typeof onNewCart === 'function' && (
                <Button size="sm" variant="secondary" className="gap-2" onClick={onNewCart} disabled={totalItems === 0}>
                  <Plus className="h-4 w-4" />
                  New Cart
                </Button>
              )}
              {showBecomePro && (
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                  onClick={onOpenPro}
                >
                  <Sparkles className="h-4 w-4" />
                  Become Pro
                </Button>
              )}
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" variant="default" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton appearance={{ elements: { userButtonBox: 'ring-1 ring-white/20' } }} />
              </SignedIn>
            </div>
            {/* Mobile auth controls (right side) */}
            <div className="sm:hidden flex items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button onClick={() => setIsMobileSheetOpen(false)} size="icon" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <LogIn className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingHeader;



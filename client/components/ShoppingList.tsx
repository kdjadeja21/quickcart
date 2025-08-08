import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2, ArrowUp, Menu, LogIn, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingItem,
  saveItems,
  loadItems,
  saveSettings,
  loadSettings,
  generateId
} from '@/lib/storage';
import { CURRENCIES, formatCurrency, getCurrencyByCode } from '@/lib/currency';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [plan, setPlan] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useUser();
  const { theme, setTheme } = useTheme();
  const initializedUserIdRef = useRef<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const savedItems = loadItems();
    const savedSettings = loadSettings();
    setItems(savedItems);
    setCurrency(savedSettings.currency);
  }, []);

  // Save items when they change
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Initialize user metadata on first sign-in per user ID
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (initializedUserIdRef.current === user.id) return;

    const ensureUserMetadata = async () => {
      const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
      const pm = (user.publicMetadata || {}) as Record<string, unknown>;

      const hasCurrency = typeof um.currency === 'string';
      const hasTheme = um.theme === 'light' || um.theme === 'dark' || um.theme === 'system';
      const planFromPublic = typeof pm.plan === 'number' ? (pm.plan as number) : undefined;

      const nextCurrency = hasCurrency ? (um.currency as string) : 'USD';
      const nextTheme = hasTheme ? (um.theme as 'light' | 'dark' | 'system') : 'system';
      const nextPlan = planFromPublic ?? 0;

      // Update local UI state from metadata (only if changed)
      setPlan(nextPlan);
      if (currency !== nextCurrency) setCurrency(nextCurrency);
      if (theme !== nextTheme) setTheme(nextTheme);

      // Seed defaults for missing currency/theme to Clerk unsafeMetadata (do not write plan from client)
      if (!hasCurrency || !hasTheme) {
        try {
          await user.update({
            unsafeMetadata: { ...um, currency: nextCurrency, theme: nextTheme },
          });
        } catch (e) {
          console.error('Failed to initialize user metadata', e);
        }
      }

      initializedUserIdRef.current = user.id;
    };

    void ensureUserMetadata();
  }, [isLoaded, isSignedIn, user, currency, theme, setTheme]);

  // When currency changes, sync to Clerk (if signed in) or local storage (guest)
  useEffect(() => {
    if (!currency) return;
    const syncCurrency = async () => {
      if (isSignedIn && isLoaded && user) {
        const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
        if (um.currency !== currency) {
          try {
            await user.update({ unsafeMetadata: { ...um, currency } });
          } catch (e) {
            console.error('Failed to update currency in user metadata', e);
          }
        }
      } else {
        saveSettings({ currency, theme: 'system' });
      }
    };
    void syncCurrency();
  }, [currency, isLoaded, isSignedIn, user]);

  // When theme changes, sync to Clerk for signed-in user
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    const syncTheme = async () => {
      const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
      const currentTheme = um.theme as 'light' | 'dark' | 'system' | undefined;
      if (currentTheme !== theme) {
        try {
          await user.update({ unsafeMetadata: { ...um, theme } });
        } catch (e) {
          console.error('Failed to update theme in user metadata', e);
        }
      }
    };
    void syncTheme();
  }, [theme, isLoaded, isSignedIn, user]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addItem = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a product name.",
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid positive price.",
        variant: "destructive",
      });
      return;
    }

    const total = quantity * priceNum;
    const newItem: ShoppingItem = {
      id: generateId(),
      name: name.trim(),
      quantity,
      price: priceNum,
      total,
      createdAt: new Date(),
    };

    setItems(prev => [newItem, ...prev]);
    setName('');
    setPrice('');
    setQuantity(1);

    toast({
      title: "Item added!",
      description: `${newItem.name} (x${newItem.quantity}) added to your list.`,
    });
  };

  const deleteItem = (itemId: string) => {
    const itemToDelete = items.find(item => item.id === itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));

    if (itemToDelete) {
      toast({
        title: "Item removed!",
        description: `${itemToDelete.name} has been removed from your list.`,
      });
    }
  };

  const clearAll = () => {
    setItems([]);
    toast({
      title: "List cleared!",
      description: "All items have been removed from your list.",
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentCurrency = getCurrencyByCode(currency);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;
  const displayProPrice = currency === 'INR' ? 'INR 99' : 'USD 1.99';

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Full-width glass header */}
      <div className="sticky top-0 z-50 w-full px-4 py-3">
        <div className="mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-md px-4 py-3">
            {/* Mobile hamburger above title */}
            <div className="sm:hidden">
              <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-md border-gray-300 dark:border-slate-700" aria-label="Open settings">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Quick Settings</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Currency</p>
                      <Select
                        value={currency}
                        onValueChange={(val) => {
                          setCurrency(val);
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
                      {plan === 0 ? (
                        <Button
                          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                          onClick={() => {
                            setIsMobileSheetOpen(false);
                            setIsProDialogOpen(true);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          Become Pro
                        </Button>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white px-2 py-1 text-xs font-semibold">
                          You’re Pro
                        </span>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-start gap-3">
              <span className="relative inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-600 text-white shadow ring-1 ring-white/20">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-medium text-white shadow" aria-label={`Items in cart: ${totalItems}`}>
                    {totalItems}
                  </span>
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="inline-block text-2xl sm:text-3xl font-semibold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-600 dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-200 bg-clip-text text-transparent">Quick Cart</h1>
                  {plan > 0 && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-blue-300/60 shadow-sm transition duration-200 hover:ring-2 hover:ring-blue-300/70 hover:shadow">
                      <Sparkles className="h-3 w-3 mr-1 opacity-90" />
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Add items and track your shopping expenses</p>
              </div>
              <div className="pt-2 sm:hidden">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button onClick={() => setIsMobileSheetOpen(false)} className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <LogIn className="h-4 w-4" />
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
              {/* Desktop controls */}
              <div className="hidden sm:flex sm:items-center gap-2">
                <div className="w-40">
                  <Select value={currency} onValueChange={setCurrency}>
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
                <div className="w-28">
                  <ThemeToggle />
                </div>
                {plan === 0 && (
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                    onClick={() => setIsProDialogOpen(true)}
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
                  <UserButton appearance={{ elements: { userButtonBox: 'shadow-sm ring-1 ring-white/20' } }} />
                </SignedIn>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-2xl px-4 py-8">

        {/* Add Item Form */}
        <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Product Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base h-12"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Price ({currentCurrency.symbol})
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    onFocus={(e) => e.currentTarget.select()}
                    onKeyPress={handleKeyPress}
                    className="text-base h-12 w-24 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((prev) => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              onClick={addItem}
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-700/20 border border-green-200/50 dark:border-emerald-600/30 shadow-xl">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">
                  {totalItems}
                </p>
                <p className="text-sm text-green-600 dark:text-emerald-400">
                  Total Items
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">
                  {totalQuantity}
                </p>
                <p className="text-sm text-green-600 dark:text-emerald-400">
                  Total Quantity
                </p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-2xl font-bold text-green-700 dark:text-emerald-300">
                  {formatCurrency(totalAmount, currentCurrency)}
                </p>
                <p className="text-sm text-green-600 dark:text-emerald-400">
                  Total Amount
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        {items.length > 0 ? (
          <>
            <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Shopping Items</CardTitle>
                  <Button
                    variant="destructive"
                    onClick={clearAll}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600/50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          Qty: {item.quantity} x {formatCurrency(item.price, currentCurrency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
                            {formatCurrency(item.total, currentCurrency)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-xl">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 dark:text-slate-500 mb-4">
                <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Your shopping list is empty
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                Add your first item using the form above
              </p>
            </CardContent>
          </Card>
        )}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            size="icon"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Become Pro Dialog */}
      <Dialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Go Pro — Lifetime Access</DialogTitle>
            <DialogDescription>
              Own Quick Cart Pro with a one‑time purchase. Sync across devices and unlock powerful features.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <p className="text-sm">
              From <span className="font-semibold">{displayProPrice}</span> • One‑time purchase • Lifetime access
            </p>
            <p className="text-sm text-muted-foreground">Regional pricing applies.</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-3 py-1 text-sm font-medium">INR 99</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1 text-sm font-medium">USD 1.99</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-amber-500" />
              <span>Save data in a secure database (access from any device)</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-amber-500" />
              <span>Create and manage up to 12 carts</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-amber-500" />
              <span>Edit items inline (name, quantity, price)</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsProDialogOpen(false)}>Maybe later</Button>
            {isSignedIn ? (
              <Button
                className="gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                onClick={() => {
                  setIsProDialogOpen(false);
                  toast({
                    title: 'Upgrade coming soon',
                    description: 'Billing is not yet connected. We\'ll enable Pro shortly.',
                  });
                }}
              >
                <Sparkles className="h-4 w-4" />
                Upgrade
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  onClick={() => setIsProDialogOpen(false)}
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to upgrade
                </Button>
              </SignInButton>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

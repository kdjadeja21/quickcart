"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import ShoppingHeader from '@/components/shopping/ShoppingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRENCIES, getCurrencyByCode, formatCurrency } from '@/lib/currency';
import type { ShoppingCart } from '@/lib/cartService';
import { listCarts, deleteCart } from '@/lib/cartService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { startApiLoading, endApiLoading } from '@/lib/loaderToast';

interface CartsClientProps {
  initialPlan: number;
}

export default function CartsClient({ initialPlan }: CartsClientProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [plan, setPlan] = useState<number>(initialPlan);
  const [currency, setCurrency] = useState<string>('INR');
  const [carts, setCarts] = useState<ShoppingCart[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cartToDelete, setCartToDelete] = useState<ShoppingCart | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
    const nextCurrency = typeof um.currency === 'string' ? um.currency : 'INR';
    setCurrency(nextCurrency);
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isSignedIn || !user?.id || plan <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        startApiLoading('Loading carts...');
        const data = await listCarts(user.id);
        if (!cancelled) setCarts(data);
      } catch {
        if (!cancelled) setCarts([]);
      } finally { endApiLoading(); }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, user?.id, plan]);

  const currentCurrency = getCurrencyByCode(currency);
  const MAX_CARTS = 12;

  const widgets = useMemo(() => {
    const cartCount = carts.length;
    // Average value per cart across all carts that have items
    const considered = carts.filter(c => c.items.length > 0);
    const totals = considered.map(c => c.items.reduce((sum, it) => sum + it.total, 0));
    const avg = totals.length > 0 ? (totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
    return { cartCount, avg };
  }, [carts]);

  async function handleConfirmDelete() {
    if (!user?.id || !cartToDelete) return;
    try {
      setIsDeleting(true);
      startApiLoading('Deleting cart...');
      await deleteCart(user.id, cartToDelete.id);
      setCarts(prev => prev.filter(c => c.id !== cartToDelete.id));
      toast.success('Cart deleted');
      setIsDeleteOpen(false);
      setCartToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete cart');
    } finally {
      setIsDeleting(false);
      endApiLoading();
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 min-h-screen">
      <ShoppingHeader
        currency={currency}
        onCurrencyChange={setCurrency}
        plan={plan}
        totalItems={0}
        onOpenPro={() => { }}
      />

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Carts</CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">Usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{widgets.cartCount}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">/ {MAX_CARTS}</div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(widgets.cartCount, MAX_CARTS) / MAX_CARTS * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Average Cart Total</CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">Across all carts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(widgets.avg, currentCurrency)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Shopping Carts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carts.map(cart => {
              const total = cart.items.reduce((sum, it) => sum + it.total, 0);
              const dateToShow = cart.updatedAt || cart.createdAt;
              return (
                <Card key={cart.id} className="hover:shadow-xl transition-shadow bg-gradient-to-br from-white via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-800">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="truncate">{cart.name || 'Untitled Cart'}</CardTitle>
                      <CardDescription>
                        {cart.items.length} items • {formatCurrency(total, currentCurrency)}
                      </CardDescription>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dateToShow.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="ml-3 self-start flex items-center gap-2">
                      <span
                        className={
                          `rounded-full border px-2 py-0.5 text-xs font-medium ${cart.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800'
                          }`
                        }
                      >
                        {cart.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                      {
                        cart.status !== 'active' && (
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Delete cart"
                            title="Delete cart"
                            onClick={() => { setCartToDelete(cart); setIsDeleteOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>)
                      }

                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {cart.items.slice(0, 5).map(it => (
                        <li key={it.id} className="flex justify-between overflow-hidden">
                          <span className="truncate mr-2">{it.name}</span>
                          <span>{it.quantity} × {formatCurrency(it.price, currentCurrency)}</span>
                        </li>
                      ))}
                      {cart.items.length > 5 && (
                        <li className="text-xs">+ {cart.items.length - 5} more…</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
            {carts.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">No carts yet.</div>
            )}
          </div>
        </div>
        <Dialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) {
              setCartToDelete(null);
              setIsDeleting(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete cart?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The cart "{cartToDelete?.name || 'Untitled Cart'}" will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isDeleting}>Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleConfirmDelete} isLoading={isDeleting}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}



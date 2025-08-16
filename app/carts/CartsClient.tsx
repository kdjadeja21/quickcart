"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ShoppingHeader from "@/components/shopping/ShoppingHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CURRENCIES, getCurrencyByCode, formatCurrency } from "@/lib/currency";
import type { ShoppingCart } from "@/lib/cartService";
import { listCarts, deleteCart } from "@/lib/cartService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";
import { startApiLoading, endApiLoading } from "@/lib/loaderToast";
import ViewCartDialog from "@/components/shopping/ViewCartDialog";

interface CartsClientProps {
  initialPlan: number;
}

export default function CartsClient({ initialPlan }: CartsClientProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [plan, setPlan] = useState<number>(initialPlan);
  const [currency, setCurrency] = useState<string>("INR");
  const [carts, setCarts] = useState<ShoppingCart[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cartToDelete, setCartToDelete] = useState<ShoppingCart | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewCartOpen, setViewCartOpen] = useState(false);
  const [cartToView, setCartToView] = useState<ShoppingCart | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    const um = (user.unsafeMetadata || {}) as Record<string, unknown>;
    const nextCurrency = typeof um.currency === "string" ? um.currency : "INR";
    setCurrency(nextCurrency);
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isSignedIn || !user?.id || plan <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        startApiLoading("Loading carts...");
        const data = await listCarts(user.id);
        if (!cancelled) setCarts(data);
      } catch {
        if (!cancelled) setCarts([]);
      } finally {
        endApiLoading();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id, plan]);

  const currentCurrency = getCurrencyByCode(currency);
  const MAX_CARTS = 12;

  const widgets = useMemo(() => {
    const cartCount = carts.length;
    // Average value per cart across all carts that have items
    const considered = carts.filter((c) => c.items.length > 0);
    const totals = considered.map((c) =>
      c.items.reduce((sum, it) => sum + it.total, 0)
    );
    const avg =
      totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    return { cartCount, avg };
  }, [carts]);

  async function handleConfirmDelete() {
    if (!user?.id || !cartToDelete) return;
    try {
      setIsDeleting(true);
      startApiLoading("Deleting cart...");
      await deleteCart(user.id, cartToDelete.id);
      setCarts((prev) => prev.filter((c) => c.id !== cartToDelete.id));
      toast.success("Cart deleted");
      setIsDeleteOpen(false);
      setCartToDelete(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete cart");
    } finally {
      setIsDeleting(false);
      endApiLoading();
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 min-h-screen">
      <ShoppingHeader plan={plan} totalItems={0} onOpenPro={() => {}} />

      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Total Carts
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400">
                Usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                  {widgets.cartCount}
                </div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                  / {MAX_CARTS}
                </div>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${
                      (Math.min(widgets.cartCount, MAX_CARTS) / MAX_CARTS) * 100
                    }%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Average Cart Total
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Across all carts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(widgets.avg, currentCurrency)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Shopping Carts
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carts.map((cart) => {
              const total = cart.items.reduce((sum, it) => sum + it.total, 0);
              const dateToShow = cart.updatedAt || cart.createdAt;
              return (
                <Card
                  key={cart.id}
                  className="group hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/50 border-0 shadow-md hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cart.name || "Untitled Cart"}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {cart.items.length} items •{" "}
                        {formatCurrency(total, currentCurrency)}
                      </CardDescription>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>
                          {dateToShow.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 self-start flex flex-col items-end gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                          cart.status === "active"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700 shadow-sm"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600 shadow-sm"
                        }`}
                      >
                        {cart.status === "active" ? "Active" : "Archived"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-700 transition-all"
                          aria-label={
                            cart.status === "active" ? "Open cart" : "View cart"
                          }
                          title={
                            cart.status === "active" ? "Open cart" : "View cart"
                          }
                          onClick={() => {
                            if (cart.status === "active") {
                              router.push("/");
                            } else {
                              setCartToView(cart);
                              setViewCartOpen(true);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        {cart.status !== "active" && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:border-red-700 transition-all"
                            aria-label="Delete cart"
                            title="Delete cart"
                            onClick={() => {
                              setCartToDelete(cart);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {cart.items.slice(0, 3).map((it, index) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-100/70 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                              {index + 1}
                            </span>
                            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                              {it.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">
                            {it.quantity} ×{" "}
                            {formatCurrency(it.price, currentCurrency)}
                          </span>
                        </div>
                      ))}
                      {cart.items.length > 3 && (
                        <div className="text-center py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                          + {cart.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {carts.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">
                No carts yet.
              </div>
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
          <DialogContent className="max-w-md">
            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Cart?
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                This action cannot be undone. The cart{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  "{cartToDelete?.name || "Untitled Cart"}"
                </span>{" "}
                will be permanently deleted along with all its items.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Cart"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Cart Dialog */}
        <ViewCartDialog
          open={viewCartOpen}
          onOpenChange={(open) => {
            setViewCartOpen(open);
            if (!open) {
              setCartToView(null);
            }
          }}
          cart={cartToView}
          currency={currentCurrency}
        />
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingItem,
  saveItems,
  loadItems,
  loadSettings,
  generateId,
} from "@/lib/storage";
import { formatCurrency, getCurrencyByCode } from "@/lib/currency";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useTheme } from "@/contexts/ThemeContext";
import ShoppingHeader from "@/components/shopping/ShoppingHeader";
import AddItemForm from "@/components/shopping/AddItemForm";
import ShoppingSummary from "@/components/shopping/ShoppingSummary";
import ShoppingItems from "@/components/shopping/ShoppingItems";
import ScrollToTopButton from "@/components/shopping/ScrollToTopButton";
import { useUserSettingsSync } from "@/hooks/useUserSettingsSync";
import { useScrollTopVisibility } from "@/hooks/useScrollTop";
import { useCurrencyDetection } from "@/hooks/useCurrencyDetection";
import {
  createCart,
  updateCart,
  getTodaysActiveCart,
  archiveOtherActiveCarts,
  archiveCart,
  listCarts,
} from "@/lib/cartService";
import { endApiLoading, startApiLoading } from "@/lib/loaderToast";
import { Loader } from "@/components/ui/loader";
import { animateIncrement } from "@/lib/utils";

export function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [plan, setPlan] = useState<number>(0);
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const [cartId, setCartId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreatingNewCart, setIsCreatingNewCart] = useState(false);
  const [skipNextPersist, setSkipNextPersist] = useState(false);
  const { theme, setTheme } = useTheme();
  const { showScrollTop, scrollToTop } = useScrollTopVisibility(300);

  // Animation state for summary values
  const [displayAmount, setDisplayAmount] = useState(() => {
    const savedSettings = loadSettings();
    const defaultCurrency = getCurrencyByCode(savedSettings.currency);
    return formatCurrency(0, defaultCurrency);
  });
  const [displayItems, setDisplayItems] = useState(0);
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const previousValues = useRef({ amount: 0, items: 0, quantity: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);

  // Use currency detection and settings
  const detectedCurrency = useCurrencyDetection();
  useEffect(() => {
    const savedSettings = loadSettings();
    // Use detected currency if available, otherwise use saved settings
    setCurrency(detectedCurrency?.code || savedSettings.currency);
  }, [detectedCurrency]);

  // Load items depending on plan: plan === 1 => Firebase, else localStorage
  useEffect(() => {
    let cancelled = false;

    async function loadFromFirebase() {
      if (!user?.id) return;
      try {
        // Load only today's active cart; if present, ensure it's the single active
        const todays = await getTodaysActiveCart(user.id);
        if (cancelled) return;
        if (todays) {
          setCartId(todays.id);
          setItems(todays.items || []);
          // Best-effort enforcement: archive any other active carts
          archiveOtherActiveCarts(user.id, todays.id).catch(() => {});
        } else {
          // No active cart for today; treat as empty until user adds an item
          setCartId(null);
          setItems([]);
        }
      } catch {
        // Fallback to local if remote fails
        const savedItems = loadItems();
        if (cancelled) return;
        setCartId(null);
        setItems(savedItems);
      }
    }

    if (plan === 1 && isSignedIn) {
      loadFromFirebase();
    } else {
      // Local mode
      const savedItems = loadItems();
      setCartId(null);
      setItems(savedItems);
    }

    return () => {
      cancelled = true;
    };
  }, [plan, isSignedIn, isLoaded, user?.id]);

  // Persist items based on plan
  useEffect(() => {
    async function persist() {
      if (skipNextPersist) {
        setSkipNextPersist(false);
        return;
      }
      if (plan === 1 && isSignedIn && user?.id && cartId) {
        try {
          await updateCart(user.id, cartId, { items, currency });
          return;
        } catch {
          // If remote save fails, also save locally as a backup
        }
      }
      saveItems(items);
    }
    persist();
  }, [items, currency, plan, isSignedIn, user?.id, cartId]);

  // Animation effect for summary values
  useEffect(() => {
    const currentCurrency = getCurrencyByCode(currency);
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalItems = items.length;

    // Animate amount changes
    if (totalAmount !== previousValues.current.amount) {
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      cleanupRef.current = animateIncrement(
        previousValues.current.amount || totalAmount,
        totalAmount,
        800,
        (value) => {
          const formattedValue = formatCurrency(value, currentCurrency);
          setDisplayAmount(formattedValue);
        },
        "easeOutQuart"
      );
      previousValues.current.amount = totalAmount;
    }

    // Animate item count changes
    if (totalItems !== previousValues.current.items) {
      animateIncrement(
        previousValues.current.items || totalItems,
        totalItems,
        600,
        (value) => setDisplayItems(Math.round(value)),
        "easeOutCubic"
      );
      previousValues.current.items = totalItems;
    }

    // Animate quantity changes
    if (totalQuantity !== previousValues.current.quantity) {
      animateIncrement(
        previousValues.current.quantity || totalQuantity,
        totalQuantity,
        600,
        (value) => setDisplayQuantity(Math.round(value)),
        "easeOutCubic"
      );
      previousValues.current.quantity = totalQuantity;
    }

    // Cleanup function
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [items, currency]);

  // Sync user settings (currency/theme/plan) with Clerk or local storage
  useUserSettingsSync({
    currency,
    setCurrency,
    theme: theme as any,
    setTheme: setTheme as any,
    setPlan,
  });

  const addItem = async () => {
    if (isAdding) return;
    if (!name.trim()) {
      toast.error("Name required", {
        description: "Please enter a product name.",
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      toast.error("Invalid price", {
        description: "Please enter a valid positive price.",
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

    if (plan === 1 && isSignedIn && user?.id) {
      setIsAdding(true);
      if (!cartId) {
        try {
          const cartName = await generateUniqueCartName(user.id);
          const created = await createCart(
            user.id,
            { name: cartName, items: [newItem], currency },
            12
          );
          setCartId(created.id);
          setSkipNextPersist(true);
          setItems(created.items || [newItem]);
        } catch {
          // If remote create fails, fall back to local
          setCartId(null);
          setItems((prev) => [newItem, ...prev]);
        }
      } else {
        setItems((prev) => [newItem, ...prev]);
      }
      setIsAdding(false);
    } else {
      setItems((prev) => [newItem, ...prev]);
    }
    setName("");
    setPrice("");
    setQuantity(1);

    toast.success("Item added!", {
      description: `${newItem.name} (x${newItem.quantity}) added to your list.`,
    });
  };

  const deleteItem = async (itemId: string) => {
    const itemToDelete = items.find((item) => item.id === itemId);

    // Optimistically update UI
    setItems((prev) => prev.filter((item) => item.id !== itemId));

    // Persist changes
    if (plan === 1 && isSignedIn && user?.id && cartId) {
      try {
        await updateCart(user.id, cartId, {
          items: items.filter((item) => item.id !== itemId),
          currency,
        });
      } catch (error) {
        // Revert on failure
        setItems((prev) => [...prev, itemToDelete!]);
        throw error;
      }
    } else {
      saveItems(items.filter((item) => item.id !== itemId));
    }

    if (itemToDelete) {
      toast("Item removed!", {
        description: `${itemToDelete.name} has been removed from your list.`,
      });
    }
  };

  const clearAll = () => {
    setItems([]);
    toast("List cleared!", {
      description: "All items have been removed from your list.",
    });
  };

  const currentCurrency = getCurrencyByCode(currency);
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalItems = items.length;
  // Set pro price based on detected or selected currency
  const displayProPrice =
    detectedCurrency?.code === "INR" || currency === "INR"
      ? "INR 99"
      : "USD 1.99";

  const generateUniqueCartName = async (uid: string) => {
    const used = new Set(
      (await listCarts(uid)).map((c) =>
        Number(c.name.match(/#(\d{1,3})$/)?.[1] || 0)
      )
    );
    for (let i = 1; i <= 999; i++)
      if (!used.has(i)) return `My Cart #${String(i).padStart(3, "0")}`;
    return `My Cart #${String(Math.floor(1 + Math.random() * 999)).padStart(
      3,
      "0"
    )}`;
  };

  const handleNewCart = async () => {
    if (isCreatingNewCart) return;
    if (!(plan === 1 && isSignedIn && user?.id)) {
      toast.error("Pro required", {
        description: "Sign in and upgrade to Pro to manage multiple carts.",
      });
      return;
    }

    // Check if user already has 12 carts
    try {
      const existingCarts = await listCarts(user.id);
      if (existingCarts.length >= 12) {
        toast.error("Cart limit reached", {
          description:
            "You have reached the maximum limit of 12 carts. To create a new cart, please delete some of your existing carts first.",
        });
        return;
      }
    } catch (error) {
      // If we can't check the cart count, proceed with caution
      console.warn("Could not check existing cart count:", error);
    }

    setIsCreatingNewCart(true);
    startApiLoading("Creating new Cart...");
    try {
      if (cartId) {
        try {
          await archiveCart(user.id, cartId);
        } catch {
          // proceed even if archiving fails
        }
      }

      // Generate a unique 3-digit id for the cart name
      const cartName = await generateUniqueCartName(user.id);
      const created = await createCart(user.id, {
        name: cartName,
        items: [],
        currency,
      });

      setSkipNextPersist(true);
      setCartId(created.id);
      setItems([]);

      // best-effort: ensure others are archived
      await archiveOtherActiveCarts(user.id, created.id).catch(() => {});

      await endApiLoading();
      toast.success("Started a new cart for today");
    } catch (error) {
      endApiLoading();
      toast.error("Could not start a new cart");
    } finally {
      setIsCreatingNewCart(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Loader
        isLoading={isCreatingNewCart || (isAdding && !cartId)}
        message={
          isCreatingNewCart
            ? "Creating new cart..."
            : "Creating cart and adding item..."
        }
      />
      <ShoppingHeader
        plan={plan}
        totalItems={totalItems}
        onOpenPro={() => setIsProDialogOpen(true)}
        onNewCart={handleNewCart}
      />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <AddItemForm
          name={name}
          price={price}
          quantity={quantity}
          currencySymbol={currentCurrency.symbol}
          onNameChange={setName}
          onPriceChange={setPrice}
          onQuantityChange={setQuantity}
          onSubmit={addItem}
          onEnterPress={addItem}
          onNewCart={handleNewCart}
          showNewCartButton={plan === 1 && isSignedIn}
          disableNewCart={totalItems === 0}
        />

        <ShoppingSummary
          totalItems={displayItems}
          totalQuantity={displayQuantity}
          totalAmountFormatted={displayAmount}
        />

        <ShoppingItems
          items={items}
          currency={currentCurrency}
          onClearAll={clearAll}
          onDeleteItem={deleteItem}
          onUpdateItem={async (id, updates) => {
            const originalItem = items.find((item) => item.id === id);
            if (!originalItem) return;

            // Optimistically update UI
            setItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
            );

            // Persist changes
            if (plan === 1 && isSignedIn && user?.id && cartId) {
              try {
                const updatedItems = items.map((it) =>
                  it.id === id ? { ...it, ...updates } : it
                );
                await updateCart(user.id, cartId, {
                  items: updatedItems,
                  currency,
                });
              } catch (error) {
                // Revert on failure
                setItems((prev) =>
                  prev.map((it) => (it.id === id ? originalItem : it))
                );
                throw error;
              }
            } else {
              const updatedItems = items.map((it) =>
                it.id === id ? { ...it, ...updates } : it
              );
              saveItems(updatedItems);
            }
          }}
          canEdit={plan === 1 && isSignedIn}
          onRequirePro={() => setIsProDialogOpen(true)}
        />

        <ScrollToTopButton show={showScrollTop} onClick={scrollToTop} />
      </div>

      {/* Become Pro Dialog */}
      <Dialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Go Pro — Lifetime Access
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 ring-1 ring-amber-300/60 px-2 py-0.5 text-xs font-semibold">
                {displayProPrice}
              </span>
            </DialogTitle>
            <DialogDescription>
              Own Quick Cart Pro with a one&#45;time purchase. Sync across
              devices and unlock powerful features.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-1">
            <p className="text-sm">
              From{" "}
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 ring-1 ring-amber-300/60 px-2.5 py-0.5 text-[13px] font-semibold">
                {displayProPrice}
              </span>{" "}
              • One&#45;time purchase • Lifetime access
            </p>
            <p className="text-sm text-muted-foreground">
              Regional pricing applies.
            </p>
            {/* <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-3 py-1 text-sm font-medium">INR 99</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1 text-sm font-medium">USD 1.99</span>
            </div> */}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-amber-500" />
              <span>
                Save data in a secure database (access from any device)
              </span>
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
            <Button variant="outline" onClick={() => setIsProDialogOpen(false)}>
              Maybe later
            </Button>
            {isSignedIn ? (
              <Button
                className="gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white"
                onClick={() => {
                  setIsProDialogOpen(false);
                  toast("Upgrade coming soon", {
                    description:
                      "Billing is not yet connected. We'll enable Pro shortly.",
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

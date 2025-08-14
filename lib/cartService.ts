import { db } from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import type { ShoppingItem } from './storage';
import { generateId } from './storage';

export class CartLimitError extends Error {
  code = 'cart/limit-exceeded';
  constructor(message = 'Cart limit reached') {
    super(message);
    this.name = 'CartLimitError';
  }
}

export interface ShoppingCart {
  id: string;
  name: string;
  items: ShoppingItem[];
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: 'active' | 'archived';
}

export interface NewCartInput {
  name: string;
  items: ShoppingItem[];
  currency?: string;
}

const userDocRef = (userId: string) => doc(db, 'users', userId);
const cartsColRef = () => collection(db, 'carts');

function toFirestoreItems(items: ShoppingItem[]): Array<{ productName: string; pricePerItem: number; quantity: number }> {
  return (items || []).map(item => ({
    productName: item.name,
    pricePerItem: item.price,
    quantity: item.quantity
  }));
}

function toDate(val: unknown, fallback: Date = new Date()): Date {
  if (!val) return fallback;
  if (val instanceof Date) return val;
  const ts = val as Timestamp & { toDate?: () => Date };
  return typeof ts?.toDate === 'function' ? ts.toDate() : fallback;
}

function fromSnap(id: string, data: any): ShoppingCart {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: ShoppingItem[] = rawItems.map((it: any) => {
    // Accept both new schema and any legacy shape
    const hasNewShape = typeof it?.productName === 'string' && typeof it?.pricePerItem === 'number';
    const name = hasNewShape ? it.productName : (it?.name ?? '');
    const price = hasNewShape ? it.pricePerItem : (typeof it?.price === 'number' ? it.price : 0);
    const quantity = typeof it?.quantity === 'number' ? it.quantity : 1;
    const total = price * quantity;
    return {
      id: generateId(),
      name,
      price,
      quantity,
      total,
      createdAt: new Date()
    };
  });

  return {
    id,
    name: data.name ?? '',
    items,
    currency: data.currency,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    userId: data.userId ?? '',
    status: (data.status === 'archived' ? 'archived' : 'active')
  };
}

export async function listCarts(userId: string): Promise<ShoppingCart[]> {
  const q = query(cartsColRef(), where('userId', '==', userId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => fromSnap(d.id, d.data()));
}

/**
 * Returns all active carts for the user ordered by last update descending.
 */
export async function listActiveCarts(userId: string): Promise<ShoppingCart[]> {
  try{
    const q = query(
      cartsColRef(),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    console.log('List active carts', snap.docs.map(d => d.data()));
    return snap.docs.map(d => fromSnap(d.id, d.data()));
  } catch (error) {
    console.error('Error listing active carts', error);
    return [];
  }
}

function isSameLocalDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/**
 * Returns the user's active cart for today (local date). If multiple are active,
 * the most recently updated cart from today is returned. If none match today's
 * date, null is returned.
 */
export async function getTodaysActiveCart(userId: string): Promise<ShoppingCart | null> {
  const today = new Date();
  const active = await listActiveCarts(userId);
  console.log('Active carts', active);
  for (const cart of active) {
    // Prefer createdAt as the cart's day identity; fall back to updatedAt
    const compareDate = cart.createdAt ?? cart.updatedAt;
    if (compareDate && isSameLocalDate(compareDate, today)) {
      return cart;
    }
  }
  return null;
}

export async function getCart(userId: string, cartId: string): Promise<ShoppingCart | null> {
  const ref = doc(cartsColRef(), cartId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromSnap(snap.id, snap.data());
}

async function syncCartCountIfMissing(userId: string): Promise<void> {
  const uRef = userDocRef(userId);
  const uSnap = await getDoc(uRef);
  if (!uSnap.exists() || typeof uSnap.data()?.cartCount !== 'number') {
    const current = await getDocs(query(cartsColRef(), where('userId', '==', userId)));
    await setDoc(uRef, { cartCount: current.size }, { merge: true });
  }
}

export async function getCartCount(userId: string): Promise<number> {
  const uSnap = await getDoc(userDocRef(userId));
  if (uSnap.exists() && typeof uSnap.data()?.cartCount === 'number') {
    return uSnap.data()!.cartCount as number;
  }
  const current = await getDocs(query(cartsColRef(), where('userId', '==', userId)));
  return current.size;
}

export async function createCart(
  userId: string,
  input: NewCartInput,
  maxCarts: number
): Promise<ShoppingCart> {
  await syncCartCountIfMissing(userId);

  const created = await runTransaction(db, async tx => {
    const uRef = userDocRef(userId);
    const uSnap = await tx.get(uRef);
    const cartCount = (uSnap.exists() && typeof uSnap.data()?.cartCount === 'number')
      ? (uSnap.data()!.cartCount as number)
      : 0;

    if (cartCount >= maxCarts) {
      throw new CartLimitError();
    }

    const cRef = doc(cartsColRef());
    tx.set(cRef, {
      name: input.name,
      items: toFirestoreItems(input.items ?? []),
      currency: input.currency,
      userId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    tx.set(uRef, { cartCount: increment(1) }, { merge: true });
    return cRef.id;
  });

  // Optimistic local timestamps; fields will sync once listeners re-fetch
  return {
    id: created,
    name: input.name,
    items: input.items ?? [],
    currency: input.currency,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    status: 'active'
  };
}

export async function updateCart(
  userId: string,
  cartId: string,
  updates: Partial<Pick<NewCartInput, 'name' | 'items' | 'currency'>>
): Promise<void> {
  const cRef = doc(cartsColRef(), cartId);
  const payload: any = { updatedAt: serverTimestamp() };
  if (typeof updates.name === 'string') payload.name = updates.name;
  if (Array.isArray(updates.items)) payload.items = toFirestoreItems(updates.items);
  if (typeof updates.currency === 'string') payload.currency = updates.currency;
  await updateDoc(cRef, payload);
}

export async function renameCart(userId: string, cartId: string, name: string): Promise<void> {
  await updateCart(userId, cartId, { name });
}

export async function deleteCart(userId: string, cartId: string): Promise<void> {
  const uRef = userDocRef(userId);
  const cRef = doc(cartsColRef(), cartId);

  await runTransaction(db, async tx => {
    const cSnap = await tx.get(cRef);
    if (!cSnap.exists()) return;
    tx.delete(cRef);

    const uSnap = await tx.get(uRef);
    const cartCount = (uSnap.exists() && typeof uSnap.data()?.cartCount === 'number')
      ? (uSnap.data()!.cartCount as number)
      : 0;

    const next = Math.max(0, cartCount - 1);
    tx.set(uRef, { cartCount: next }, { merge: true });
  });
}

/**
 * Archives all other active carts for the user, keeping the specified cartId (if provided) active.
 * This is a best-effort enforcement to ensure only one active cart exists.
 */
export async function archiveOtherActiveCarts(userId: string, keepCartId?: string): Promise<void> {
  const q = query(
    cartsColRef(),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  const updates: Array<Promise<void>> = [];
  for (const d of snap.docs) {
    if (d.id === keepCartId) continue;
    updates.push(updateDoc(doc(cartsColRef(), d.id), { status: 'archived', updatedAt: serverTimestamp() }));
  }
  if (updates.length > 0) {
    await Promise.all(updates);
  }
}
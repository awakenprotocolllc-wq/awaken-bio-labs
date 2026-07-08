"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export type CartItem = {
  product: string;
  strength: string;
  price: string; // dollar string e.g. "$65.00"
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (product: string, strength: string) => void;
  updateQty: (product: string, strength: string, qty: number) => void;
  clearCart: () => void;
  /** Replace the entire cart (used by cross-device cart restore). */
  replaceCart: (items: CartItem[]) => void;
  totalItems: number;
  subtotal: string;
  /** Controls the slide-in drawer */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "awaken_cart";

function parsePrice(p: string): number {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  // Mirror the cart server-side for abandoned-cart tracking (authenticated
  // customers only — the endpoint 401s for guests and we silently ignore it).
  // Debounced so rapid qty changes produce one sync. Every synced mutation
  // counts as "meaningful activity" and resets the abandonment timer.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstSync = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    // Skip the initial hydration pass — only real mutations sync
    if (firstSync.current) { firstSync.current = false; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => { /* guest or offline — ignore */ });
    }, 2000);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [items, hydrated]);

  const addItem = useCallback((newItem: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product === newItem.product && i.strength === newItem.strength
      );
      if (existing) {
        return prev.map((i) =>
          i.product === newItem.product && i.strength === newItem.strength
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((product: string, strength: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product === product && i.strength === strength))
    );
  }, []);

  const updateQty = useCallback((product: string, strength: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product === product && i.strength === strength ? { ...i, qty } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const replaceCart = useCallback((newItems: CartItem[]) => {
    setItems(newItems.filter((i) => i && i.product && i.strength && i.qty >= 1));
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  const subtotal =
    "$" +
    items
      .reduce((s, i) => s + parsePrice(i.price) * i.qty, 0)
      .toFixed(2);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        replaceCart,
        totalItems,
        subtotal,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

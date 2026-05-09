"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQty,
    totalItems,
    subtotal,
    drawerOpen,
    closeDrawer,
  } = useCart();

  const router = useRouter();

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function handleCheckout() {
    closeDrawer();
    router.push("/checkout");
  }

  function parsePrice(p: string): number {
    const n = parseFloat(p.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[300] bg-black/60"
          />

          {/* Drawer panel */}
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[301] w-full max-w-[420px] bg-carbon border-l border-slate flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate shrink-0">
              <div>
                <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">
                  — Your Cart —
                </p>
                <p className="font-sans font-bold text-paper text-lg mt-0.5">
                  {totalItems === 0
                    ? "Empty"
                    : `${totalItems} item${totalItems > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close cart"
                className="h-10 w-10 flex items-center justify-center text-bone hover:text-accent transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-slate mb-4">
                    <path
                      d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                    />
                    <circle cx="10" cy="21" r="1.3" fill="currentColor" />
                    <circle cx="17" cy="21" r="1.3" fill="currentColor" />
                  </svg>
                  <p className="font-mono text-bone text-sm">Your cart is empty.</p>
                  <button
                    onClick={closeDrawer}
                    className="mt-4 font-mono text-accent text-xs tracking-wider hover:underline"
                  >
                    Continue Shopping →
                  </button>
                </div>
              )}

              {items.map((item) => {
                const lineTotal = (parsePrice(item.price) * item.qty).toFixed(2);
                return (
                  <div
                    key={`${item.product}-${item.strength}`}
                    className="bg-obsidian border border-slate p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-sans font-semibold text-paper text-sm leading-snug">
                          {item.product}
                        </p>
                        <p className="font-mono text-accent text-[11px] mt-0.5">{item.strength}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product, item.strength)}
                        aria-label={`Remove ${item.product}`}
                        className="text-bone/50 hover:text-accent transition-colors shrink-0 mt-0.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center gap-0">
                        <button
                          onClick={() => updateQty(item.product, item.strength, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="h-8 w-9 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-base flex items-center justify-center disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="h-8 w-10 border-y border-slate text-paper font-mono text-sm flex items-center justify-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.product, item.strength, item.qty + 1)}
                          className="h-8 w-9 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-base flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono text-accent text-sm font-bold">
                        ${lineTotal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate px-5 py-5 shrink-0 space-y-4 bg-carbon">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-bone text-xs tracking-wider uppercase">Subtotal</span>
                  <span className="font-mono text-accent text-xl font-bold">{subtotal}</span>
                </div>
                <p className="font-mono text-white/30 text-[10px] leading-relaxed">
                  Payment via Zelle after order is placed. Instructions will be emailed to you.
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-accent text-obsidian font-semibold h-13 min-h-[48px] text-base hover:bg-accent/80 transition-colors flex items-center justify-center gap-2"
                >
                  Checkout — {subtotal}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { CARD_PAYMENTS_ENABLED } from "@/lib/payments";
import { products, categories, getPriceForStrength } from "@/lib/products";

// ── Types ────────────────────────────────────────────────────────────────────

type CartItem = { product: string; strength: string; qty: number; retailPrice: string; partnerPrice: string };
type Address  = { line1: string; city: string; state: string; zip: string };
type CardDisplay = { last4: string; brand: string; expiryMonth: string; expiryYear: string };

const DISCOUNT = 0.30;
const BRAND_LABELS: Record<string, string> = { visa: "Visa", mc: "Mastercard", amex: "Amex", other: "Card" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePrice(p: string) {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function partnerPrice(retail: string) {
  return `$${(parsePrice(retail) * (1 - DISCOUNT)).toFixed(2)}`;
}

function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + parsePrice(i.partnerPrice) * i.qty, 0);
}

function isOrderableRetail(price: string | null): price is string {
  return !!price && price.startsWith("$") && !price.includes("–") && price !== "Contact Seller";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QtyControl({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, qty - 1))}
        className="w-7 h-7 border border-slate text-bone hover:border-accent hover:text-accent transition-colors font-mono text-sm leading-none"
      >−</button>
      <span className="font-mono text-paper text-sm w-6 text-center">{qty}</span>
      <button
        onClick={() => onChange(Math.min(15, qty + 1))}
        className="w-7 h-7 border border-slate text-bone hover:border-accent hover:text-accent transition-colors font-mono text-sm leading-none"
      >+</button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AffiliateOrderPage() {
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Saved data
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [savedCard, setSavedCard]       = useState<CardDisplay | null>(null);

  // Form state
  const [address, setAddress]           = useState<Address>({ line1: "", city: "", state: "", zip: "" });
  const [useSavedAddress, setUseSavedAddress] = useState(true);

  // Payment
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [newCard, setNewCard]           = useState({ number: "", holderName: "", expiryMonth: "", expiryYear: "", cvv: "" });
  const [saveCard, setSaveCard]         = useState(true);

  // Submission
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // Card mgmt
  const [removingCard, setRemovingCard] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingCard, setSavingCard]     = useState(false);
  const [cardError, setCardError]       = useState<string | null>(null);

  // Load saved address + card on mount
  useEffect(() => {
    fetch("/api/affiliate/address")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.address) {
          setSavedAddress(d.address);
          setAddress(d.address);
        }
      })
      .catch(() => {});

    fetch("/api/affiliate/payment")
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.card) setSavedCard(d.card); })
      .catch(() => {});
  }, []);

  // Switch to manual address form when no saved address
  useEffect(() => {
    if (!savedAddress) setUseSavedAddress(false);
  }, [savedAddress]);

  // Switch to card entry when no saved card
  useEffect(() => {
    if (!savedCard) setUseSavedCard(false);
  }, [savedCard]);

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const setQty = useCallback((productName: string, strength: string, retailP: string, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product === productName && i.strength === strength);
      if (qty === 0) return prev.filter((i) => !(i.product === productName && i.strength === strength));
      if (existing) return prev.map((i) => i.product === productName && i.strength === strength ? { ...i, qty } : i);
      return [...prev, { product: productName, strength, qty, retailPrice: retailP, partnerPrice: partnerPrice(retailP) }];
    });
  }, []);

  function getQty(productName: string, strength: string) {
    return cart.find((i) => i.product === productName && i.strength === strength)?.qty ?? 0;
  }

  // ── Save address ────────────────────────────────────────────────────────────

  async function handleSaveAddress() {
    setSavingAddress(true);
    try {
      const res = await fetch("/api/affiliate/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      const d = await res.json();
      if (d.ok) {
        setSavedAddress(address);
        setUseSavedAddress(true);
      }
    } finally {
      setSavingAddress(false);
    }
  }

  // ── Save card ───────────────────────────────────────────────────────────────

  async function handleSaveCard() {
    setCardError(null);
    setSavingCard(true);
    try {
      const res = await fetch("/api/affiliate/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCard),
      });
      const d = await res.json();
      if (d.ok) {
        setSavedCard(d.card);
        setUseSavedCard(true);
        setNewCard({ number: "", holderName: "", expiryMonth: "", expiryYear: "", cvv: "" });
      } else {
        setCardError(d.error ?? "Could not save card.");
      }
    } catch {
      setCardError("Network error.");
    } finally {
      setSavingCard(false);
    }
  }

  async function handleRemoveCard() {
    setRemovingCard(true);
    try {
      await fetch("/api/affiliate/payment", { method: "DELETE" });
      setSavedCard(null);
      setUseSavedCard(false);
    } finally {
      setRemovingCard(false);
    }
  }

  // ── Place order ─────────────────────────────────────────────────────────────

  async function handlePlaceOrder() {
    setError(null);
    if (cart.length === 0) { setError("Your cart is empty."); return; }

    const shippingAddr = useSavedAddress && savedAddress ? savedAddress : address;
    if (!shippingAddr.line1.trim() || !shippingAddr.city.trim() || !shippingAddr.state.trim() || !shippingAddr.zip.trim()) {
      setError("Complete shipping address is required."); return;
    }

    // Card details only apply when card payments are enabled (Zelle-only mode
    // skips this entirely — payment is sent after the order is placed)
    if (CARD_PAYMENTS_ENABLED && !useSavedCard) {
      const digits = newCard.number.replace(/\D/g, "");
      if (digits.length < 13) { setError("Valid card number required."); return; }
      if (!newCard.holderName.trim()) { setError("Cardholder name required."); return; }
      if (!newCard.expiryMonth || !newCard.expiryYear) { setError("Card expiry required."); return; }
      if (!newCard.cvv.trim()) { setError("CVV required."); return; }

      // Save card first if requested
      if (saveCard) await handleSaveCard();
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliate/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ product: i.product, strength: i.strength, qty: i.qty })),
          shipping: shippingAddr,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setConfirmedOrderId(d.orderId);
        setCart([]);
      } else {
        setError(d.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Filtered products ───────────────────────────────────────────────────────

  const visibleProducts = products.filter((p) => {
    if (activeCategory !== "All" && p.category !== activeCategory) return false;
    // Must have at least one orderable strength
    return p.strengths.some((s) => {
      const rp = getPriceForStrength(p, s);
      return isOrderableRetail(rp);
    });
  });

  // ── Confirmed state ─────────────────────────────────────────────────────────

  if (confirmedOrderId) {
    return (
      <AffiliateDashboardShell title="Order.">
        <div className="max-w-lg bg-carbon border border-accent p-8 space-y-4">
          <p className="font-mono text-accent text-[10px] tracking-[0.2em]">— ORDER PLACED —</p>
          <h2 className="font-sans font-bold text-paper text-2xl">Order confirmed.</h2>
          <p className="text-bone text-sm">
            Order <span className="font-mono text-accent uppercase">#{confirmedOrderId}</span> has been received and is being processed.
          </p>
          {!CARD_PAYMENTS_ENABLED && (
            <div className="bg-obsidian border border-accent/40 px-4 py-3 font-mono text-sm space-y-1">
              <p className="text-accent text-[10px] uppercase tracking-wider">📲 Send Zelle Payment</p>
              <p className="text-paper font-bold">awakenbiolabs</p>
              <p className="text-bone text-xs">AWAKEN BIOLABS LLC</p>
              <p className="text-bone/60 text-[10px] mt-2 leading-relaxed">
                Include order #{confirmedOrderId.toUpperCase()} in the memo. Your order ships once payment is verified.
              </p>
            </div>
          )}
          <p className="text-bone/60 text-xs font-mono">
            Your 30% partner discount has been applied. You&apos;ll receive shipping confirmation at your email on file.
          </p>
          <button
            onClick={() => setConfirmedOrderId(null)}
            className="font-mono text-xs text-accent border border-accent/40 px-5 h-10 min-h-[44px] hover:bg-accent/10 transition-colors tracking-wider"
          >
            Place Another Order →
          </button>
        </div>
      </AffiliateDashboardShell>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <AffiliateDashboardShell title="Order.">
      <div className="mb-6">
        <p className="font-mono text-accent text-[10px] tracking-[0.25em] mb-1">— PARTNER PRICING —</p>
        <p className="text-bone text-sm">All compounds listed at your <span className="text-paper font-semibold">30% partner discount</span>.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">

        {/* ── Product list ── */}
        <div className="space-y-6">

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {["All", ...categories.filter((c) => c !== "All")].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${
                  activeCategory === cat
                    ? "border-accent text-accent bg-accent/5"
                    : "border-slate text-bone hover:border-accent/50 hover:text-paper"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Product rows */}
          <div className="bg-carbon border border-slate">
            {/* Header */}
            <div className="hidden sm:grid grid-cols-[1fr_90px_90px_100px] gap-4 px-5 py-3 border-b border-slate font-mono text-[10px] text-bone tracking-[0.15em] uppercase">
              <div>Compound</div>
              <div className="text-right">Retail</div>
              <div className="text-right text-accent">Partner</div>
              <div className="text-center">Qty</div>
            </div>

            {visibleProducts.map((p) =>
              p.strengths
                .filter((s) => isOrderableRetail(getPriceForStrength(p, s)))
                .map((strength) => {
                  const retail = getPriceForStrength(p, strength)!;
                  const partner = partnerPrice(retail);
                  const qty = getQty(p.name, strength);
                  const key = `${p.name}|${strength}`;

                  return (
                    <div
                      key={key}
                      className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_90px_100px] gap-3 sm:gap-4 items-center px-5 py-3 border-b border-slate/50 last:border-b-0 transition-colors ${
                        qty > 0 ? "bg-accent/5" : "hover:bg-slate/10"
                      }`}
                    >
                      <div>
                        <p className="font-sans font-medium text-paper text-sm">{p.name}</p>
                        <p className="font-mono text-bone/60 text-[10px] mt-0.5">
                          {strength}{p.subtitle ? ` · ${p.subtitle}` : ""}
                        </p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-mono text-bone/50 text-xs line-through">{retail}</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="font-mono text-accent text-sm font-bold">{partner}</p>
                      </div>
                      <div className="flex sm:justify-center items-center gap-3">
                        {/* Mobile price */}
                        <div className="sm:hidden text-right">
                          <p className="font-mono text-bone/40 text-[10px] line-through">{retail}</p>
                          <p className="font-mono text-accent text-xs font-bold">{partner}</p>
                        </div>
                        <QtyControl qty={qty} onChange={(n) => setQty(p.name, strength, retail, n)} />
                      </div>
                    </div>
                  );
                })
            )}

            {visibleProducts.length === 0 && (
              <p className="px-5 py-8 text-bone font-mono text-sm">No compounds in this category.</p>
            )}
          </div>
        </div>

        {/* ── Cart + checkout ── */}
        <div className="xl:sticky xl:top-6 space-y-5">

          {/* Cart summary */}
          <div className="bg-carbon border border-slate">
            <div className="px-5 py-4 border-b border-slate flex items-center justify-between">
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent">— YOUR ORDER —</p>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="font-mono text-[10px] text-bone/50 hover:text-red-400 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="px-5 py-6 font-mono text-bone text-xs">No items added yet.</p>
            ) : (
              <>
                <div className="divide-y divide-slate/50">
                  {cart.map((item) => (
                    <div key={`${item.product}|${item.strength}`} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-sans text-paper text-sm truncate">{item.product}</p>
                        <p className="font-mono text-bone/50 text-[10px]">{item.strength} · {item.partnerPrice} each</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <QtyControl
                          qty={item.qty}
                          onChange={(n) => setQty(item.product, item.strength, item.retailPrice, n)}
                        />
                        <p className="font-mono text-accent text-sm font-bold w-16 text-right">
                          ${(parsePrice(item.partnerPrice) * item.qty).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-slate flex items-center justify-between">
                  <p className="font-mono text-bone text-xs tracking-wider">TOTAL</p>
                  <p className="font-mono text-accent text-lg font-bold">${cartTotal(cart).toFixed(2)}</p>
                </div>
              </>
            )}
          </div>

          {/* Shipping address */}
          <div className="bg-carbon border border-slate">
            <div className="px-5 py-4 border-b border-slate">
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent">— SHIP TO —</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {savedAddress && (
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => setUseSavedAddress(true)}
                    className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${useSavedAddress ? "border-accent text-accent bg-accent/5" : "border-slate text-bone"}`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => setUseSavedAddress(false)}
                    className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${!useSavedAddress ? "border-accent text-accent bg-accent/5" : "border-slate text-bone"}`}
                  >
                    New address
                  </button>
                </div>
              )}

              {useSavedAddress && savedAddress ? (
                <div className="font-mono text-sm text-paper space-y-0.5">
                  <p>{savedAddress.line1}</p>
                  <p>{savedAddress.city}, {savedAddress.state} {savedAddress.zip}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(["line1", "city", "state", "zip"] as const).map((field) => (
                    <input
                      key={field}
                      type="text"
                      placeholder={field === "line1" ? "Street address" : field.charAt(0).toUpperCase() + field.slice(1)}
                      value={address[field]}
                      onChange={(e) => setAddress((a) => ({ ...a, [field]: e.target.value }))}
                      className="w-full bg-obsidian border border-slate text-paper font-sans text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors"
                    />
                  ))}
                  <button
                    onClick={handleSaveAddress}
                    disabled={savingAddress}
                    className="font-mono text-[10px] tracking-wider text-bone border border-slate px-3 py-1.5 hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                  >
                    {savingAddress ? "Saving…" : "Save for next time"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment — Zelle-only while card payments are disabled (lib/payments.ts) */}
          {!CARD_PAYMENTS_ENABLED ? (
            <div className="bg-carbon border border-slate">
              <div className="px-5 py-4 border-b border-slate">
                <p className="font-mono text-[10px] tracking-[0.2em] text-accent">— PAYMENT · ZELLE —</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-bone text-sm leading-relaxed">
                  Card payments are temporarily unavailable. After placing your order, send the
                  order total via Zelle:
                </p>
                <div className="bg-obsidian border border-slate px-4 py-3 font-mono text-sm space-y-1">
                  <p className="text-bone/60 text-[10px] uppercase tracking-wider">Send Zelle To</p>
                  <p className="text-paper font-bold">awakenbiolabs</p>
                  <p className="text-bone text-xs">AWAKEN BIOLABS LLC</p>
                </div>
                <p className="font-mono text-bone/50 text-[10px] leading-relaxed">
                  Include your order number in the Zelle memo. Your order ships once payment is
                  verified.
                </p>
              </div>
            </div>
          ) : (
          <div className="bg-carbon border border-slate">
            <div className="px-5 py-4 border-b border-slate">
              <p className="font-mono text-[10px] tracking-[0.2em] text-accent">— PAYMENT —</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {savedCard && (
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => setUseSavedCard(true)}
                    className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${useSavedCard ? "border-accent text-accent bg-accent/5" : "border-slate text-bone"}`}
                  >
                    Saved card
                  </button>
                  <button
                    onClick={() => setUseSavedCard(false)}
                    className={`font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors ${!useSavedCard ? "border-accent text-accent bg-accent/5" : "border-slate text-bone"}`}
                  >
                    New card
                  </button>
                </div>
              )}

              {useSavedCard && savedCard ? (
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-paper">
                    <span className="text-bone/60 text-[10px] uppercase tracking-wider">{BRAND_LABELS[savedCard.brand] ?? "Card"}</span>
                    <p>•••• {savedCard.last4} &nbsp;{savedCard.expiryMonth}/{savedCard.expiryYear.slice(-2)}</p>
                  </div>
                  <button
                    onClick={handleRemoveCard}
                    disabled={removingCard}
                    className="font-mono text-[10px] text-bone/40 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Card number"
                    value={newCard.number}
                    maxLength={19}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
                      setNewCard((c) => ({ ...c, number: formatted }));
                    }}
                    className="w-full bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors tracking-widest"
                  />
                  <input
                    type="text"
                    placeholder="Cardholder name"
                    value={newCard.holderName}
                    onChange={(e) => setNewCard((c) => ({ ...c, holderName: e.target.value }))}
                    className="w-full bg-obsidian border border-slate text-paper font-sans text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="MM"
                      value={newCard.expiryMonth}
                      maxLength={2}
                      onChange={(e) => setNewCard((c) => ({ ...c, expiryMonth: e.target.value.replace(/\D/g, "") }))}
                      className="bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors text-center"
                    />
                    <input
                      type="text"
                      placeholder="YYYY"
                      value={newCard.expiryYear}
                      maxLength={4}
                      onChange={(e) => setNewCard((c) => ({ ...c, expiryYear: e.target.value.replace(/\D/g, "") }))}
                      className="bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors text-center"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={newCard.cvv}
                      maxLength={4}
                      onChange={(e) => setNewCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "") }))}
                      className="bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors text-center"
                    />
                  </div>
                  {!savedCard && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="accent-accent"
                      />
                      <span className="font-mono text-[10px] text-bone tracking-wider">Save card for future orders</span>
                    </label>
                  )}
                  {cardError && <p className="font-mono text-[10px] text-red-400">{cardError}</p>}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Place order */}
          {error && (
            <p className="font-mono text-[11px] text-red-400 tracking-wide">{error}</p>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={submitting || cart.length === 0}
            className="w-full bg-accent text-obsidian font-semibold font-sans h-12 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing order…" : cart.length === 0 ? "Add items to order" : `Place Order — $${cartTotal(cart).toFixed(2)}`}
          </button>

          <p className="font-mono text-[10px] text-bone/40 text-center">
            30% partner discount applied automatically
          </p>
        </div>
      </div>
    </AffiliateDashboardShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useCart } from "@/lib/cart";

function parsePrice(p: string): number {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

const BAC_WATER = { product: "BAC Water", strength: "10ml", price: "$9.50" } as const;

export default function CheckoutForm() {
  const router = useRouter();
  const { items, addItem, updateQty, removeItem, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [codeError, setCodeError] = useState("");
  const [validating, setValidating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasBacWater = items.some((i) => i.product === "BAC Water");

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Calculate totals
  const rawSubtotal = items.reduce((sum, i) => sum + parsePrice(i.price) * i.qty, 0);
  const discountAmount = appliedCode ? rawSubtotal * discountRate : 0;
  const finalTotal = rawSubtotal - discountAmount;

  function fmtPrice(n: number) {
    return `$${n.toFixed(2)}`;
  }

  async function applyCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setAppliedCode(null);
      setDiscountRate(0);
      setCodeError("");
      return;
    }

    setValidating(true);
    setCodeError("");
    try {
      const res = await fetch(`/api/affiliate/validate-code?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.valid) {
        setAppliedCode(trimmed);
        setDiscountRate(data.discountRate);
        setCodeError("");
      } else {
        setAppliedCode(null);
        setDiscountRate(0);
        setCodeError("Code not found or no longer active.");
      }
    } catch {
      setCodeError("Could not validate code. Try again.");
    } finally {
      setValidating(false);
    }
  }

  function handleCodeInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setDiscountInput(val);
    // Clear applied code if user edits
    if (appliedCode && val.trim().toUpperCase() !== appliedCode) {
      setAppliedCode(null);
      setDiscountRate(0);
    }
    // Debounce validation
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyCode(val), 600);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty. Add some products before checking out.");
      return;
    }
    if (!form.name || !form.email || !form.line1 || !form.city || !form.state || !form.zip) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone || undefined },
          shipping: { line1: form.line1, city: form.city, state: form.state, zip: form.zip },
          items: items.map((i) => ({
            product: i.product,
            strength: i.strength,
            price: i.price,
            qty: i.qty,
          })),
          notes: form.notes || undefined,
          discountCode: appliedCode || undefined,
          discountAmount: discountAmount > 0 ? fmtPrice(discountAmount) : undefined,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Unknown error");

      clearCart();
      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Order items */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— YOUR ORDER —</p>

        {items.length === 0 && (
          <p className="text-bone text-sm">
            Your cart is empty.{" "}
            <a href="/shop" className="text-accent hover:underline">
              Browse the catalog →
            </a>
          </p>
        )}

        {items.map((item) => {
          const lineTotal = (parsePrice(item.price) * item.qty).toFixed(2);
          return (
            <div
              key={`${item.product}-${item.strength}`}
              className="flex items-center gap-4 bg-carbon border border-slate p-4 mb-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-paper text-sm truncate">{item.product}</p>
                <p className="font-mono text-accent text-xs mt-0.5">{item.strength}</p>
              </div>
              <div className="flex items-center gap-0">
                <button
                  type="button"
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
                  type="button"
                  onClick={() => updateQty(item.product, item.strength, item.qty + 1)}
                  className="h-8 w-9 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-base flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="font-mono text-accent text-sm font-semibold w-20 text-right shrink-0">
                ${lineTotal}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.product, item.strength)}
                  className="text-bone hover:text-accent transition-colors ml-1"
                  aria-label={`Remove ${item.product}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}

        {/* BAC Water upsell */}
        {items.length > 0 && !hasBacWater && (
          <div className="border border-accent/30 bg-accent/5 p-4 flex items-center gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase mb-1">— ADD-ON —</p>
              <p className="font-sans font-semibold text-paper text-sm">BAC Water <span className="text-bone font-normal">· 10ml</span></p>
              <p className="font-sans text-bone text-xs mt-0.5">Bacteriostatic water for reconstitution — required for all lyophilized peptides.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-accent text-sm font-bold mb-2">$9.50</p>
              <button
                type="button"
                onClick={() => addItem({ product: BAC_WATER.product, strength: BAC_WATER.strength, price: BAC_WATER.price })}
                className="font-mono text-xs text-obsidian bg-accent px-4 py-2 hover:bg-accent/80 transition-colors tracking-wider"
              >
                Add +
              </button>
            </div>
          </div>
        )}

        {/* Discount code */}
        {items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate">
            <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">
              Affiliate / Discount Code (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={handleCodeInput}
                placeholder="e.g. JOHNDOE"
                maxLength={20}
                className="flex-1 bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors uppercase"
              />
              <button
                type="button"
                onClick={() => applyCode(discountInput)}
                disabled={validating || !discountInput.trim()}
                className="font-mono text-xs text-obsidian bg-accent px-5 h-11 hover:bg-accent/80 transition-colors disabled:opacity-40 tracking-wider"
              >
                {validating ? "…" : "Apply"}
              </button>
            </div>
            {codeError && (
              <p className="font-mono text-red-400 text-[11px] mt-2">{codeError}</p>
            )}
            {appliedCode && (
              <p className="font-mono text-green-400 text-[11px] mt-2">
                ✓ Code <strong>{appliedCode}</strong> applied — {Math.round(discountRate * 100)}% off
              </p>
            )}
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-4 space-y-2">
            {appliedCode && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-bone text-xs tracking-wider uppercase">Subtotal</span>
                  <span className="font-mono text-bone text-sm">{fmtPrice(rawSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-green-400 text-xs tracking-wider uppercase">
                    Discount ({Math.round(discountRate * 100)}% — {appliedCode})
                  </span>
                  <span className="font-mono text-green-400 text-sm">−{fmtPrice(discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center border-t border-slate pt-3">
              <span className="font-mono text-bone text-xs tracking-wider uppercase">Total</span>
              <span className="font-mono text-accent text-xl font-bold">{fmtPrice(finalTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Customer info */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-6">— YOUR DETAILS —</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" name="name" value={form.name} onChange={handleField} />
          <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleField} />
          <Field label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={handleField} />
        </div>
      </div>

      {/* Shipping address */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-6">— SHIPPING ADDRESS —</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address *" name="line1" value={form.line1} onChange={handleField} />
          </div>
          <Field label="City *" name="city" value={form.city} onChange={handleField} />
          <Field label="State *" name="state" placeholder="e.g. NV" value={form.state} onChange={handleField} />
          <Field label="ZIP Code *" name="zip" value={form.zip} onChange={handleField} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
          Order Notes (optional)
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleField}
          rows={3}
          placeholder="Any special instructions or questions..."
          className="w-full bg-carbon border border-slate text-paper placeholder-bone/40 font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent transition-colors resize-none"
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-carbon border border-slate p-4">
        <p className="font-mono text-white/40 text-[11px] tracking-widest uppercase leading-relaxed">
          By placing this order you confirm all products are for in-vitro research use only and not for
          human or veterinary consumption. Payment is via Zelle. Instructions will be emailed to you.
        </p>
      </div>

      {error && (
        <p className="font-mono text-red-400 text-sm border border-red-400/30 bg-red-400/10 px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || items.length === 0}
        className="w-full bg-accent text-obsidian font-semibold h-14 min-h-[44px] text-base hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Placing Order..." : `Place Order — ${fmtPrice(finalTotal)}`}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-carbon border border-slate text-paper placeholder-bone/40 font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

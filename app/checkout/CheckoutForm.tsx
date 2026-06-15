"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import SuccessTransition from "@/components/SuccessTransition";
import type { CustomerAccount, SavedPayment } from "@/lib/customer-db";

function parsePrice(p: string): number {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Shipping calculation
// Origin: Las Vegas, NV · Carrier: UPS 2-Day
// Las Vegas NV: $11.70 actual + $2.00 markup = $13.70
// All other US:  $14.50 standard + $3.00 markup = $17.50
// ---------------------------------------------------------------------------
function calcShipping(city: string, state: string): { cost: number; label: string } {
  const isLasVegas =
    state.trim().toUpperCase() === "NV" &&
    city.trim().toLowerCase().replace(/[^a-z]/g, "").includes("lasvegas");
  return isLasVegas
    ? { cost: 13.70, label: "UPS 2-Day · Las Vegas" }
    : { cost: 17.50, label: "UPS 2-Day · Standard" };
}

const BAC_WATER = { product: "BAC Water", strength: "10ml", price: "$9.50" } as const;

export default function CheckoutForm() {
  const router = useRouter();
  const { items, addItem, updateQty, removeItem, clearCart } = useCart();

  // Customer session (null = not checked yet or logged out, use sessionChecked to distinguish)
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [savedPayment, setSavedPayment] = useState<Pick<SavedPayment, "last4"|"brand"|"expiryMonth"|"expiryYear"> | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

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

  // Card details
  const [card, setCard] = useState({
    number: "",
    holderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [useSavedCard, setUseSavedCard]   = useState(false);
  const [saveCard, setSaveCard]           = useState(false);

  // OTP flow state (statusCode 3)
  const [otpState, setOtpState] = useState<{ transactionId: string; orderId: string } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "zelle">("card");

  // Honeypot — hidden from real users; bots fill it; backend rejects non-empty
  const [honeypot, setHoneypot] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Success transition
  const [successLabel, setSuccessLabel] = useState("");
  const pendingRedirect = useRef<string>("");
  const handleSuccessComplete = useCallback(() => {
    router.push(pendingRedirect.current);
  }, [router]);

  // Check customer session on mount and pre-fill form
  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.customer) {
          const c: CustomerAccount = data.customer;
          setCustomer(c);
          setSavedPayment(data.savedPayment ?? null);
          // Pre-fill name and email
          setForm((f) => ({
            ...f,
            name:  f.name  || c.name,
            email: f.email || c.email,
          }));
          // Pre-fill default address if available
          const defaultAddr = c.addresses?.find((a) => a.isDefault);
          if (defaultAddr) {
            setForm((f) => ({
              ...f,
              line1: f.line1 || defaultAddr.line1,
              city:  f.city  || defaultAddr.city,
              state: f.state || defaultAddr.state,
              zip:   f.zip   || defaultAddr.zip,
            }));
          }
          // Offer saved card if one exists
          if (data.savedPayment) setUseSavedCard(true);
        } else {
          setCustomer(null);
        }
        setSessionChecked(true);
      })
      .catch(() => { setCustomer(null); setSessionChecked(true); });
  }, []);

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

  // ── Card helpers ───────────────────────────────────────────────────────────
  function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCard((c) => ({ ...c, number: formatted }));
  }

  function handleCardField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setCard((c) => ({ ...c, [e.target.name]: e.target.value }));
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const rawSubtotal = items.reduce((sum, i) => sum + parsePrice(i.price) * i.qty, 0);
  const discountAmount = appliedCode ? rawSubtotal * discountRate : 0;
  const afterDiscount = rawSubtotal - discountAmount;
  const shipping = calcShipping(form.city, form.state);
  // Only show/add shipping once city + state are filled in
  const shippingReady = form.city.trim().length > 0 && form.state.trim().length > 0;
  const shippingCost = shippingReady ? shipping.cost : 0;
  const baseTotal = afterDiscount + shippingCost;
  const processingFee = paymentMethod === "card" ? baseTotal * 0.04 : 0;
  const orderTotal = baseTotal + processingFee;

  function fmtPrice(n: number) {
    return `$${n.toFixed(2)}`;
  }

  // ── Discount code ─────────────────────────────────────────────────────────
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
    if (appliedCode && val.trim().toUpperCase() !== appliedCode) {
      setAppliedCode(null);
      setDiscountRate(0);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyCode(val), 600);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty. Add some products before checking out.");
      return;
    }
    if (!form.name || !form.email || !form.line1 || !form.city || !form.state || !form.zip) {
      setError("Please fill in all required shipping fields.");
      return;
    }
    if (paymentMethod === "card" && (!card.number || !card.holderName || !card.expiryMonth || !card.expiryYear || !card.cvv)) {
      setError("Please fill in all card details.");
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
          shippingCost: fmtPrice(shipping.cost),
          processingFee: processingFee > 0 ? fmtPrice(processingFee) : undefined,
          orderTotal: fmtPrice(orderTotal),
          paymentMethod,
          // If using saved card, signal the API to decrypt and use it
          useSavedCard: useSavedCard && !!savedPayment,
          card: paymentMethod === "card" && !useSavedCard ? {
            number: card.number.replace(/\s/g, ""),
            holderName: card.holderName,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            cvv: card.cvv,
          } : undefined,
          saveCard: saveCard && paymentMethod === "card" && !useSavedCard,
          customerId: customer ? customer.id : undefined,
          website: honeypot, // honeypot — backend rejects if non-empty
        }),
      });

      const data = await res.json();

      // Declined or error
      if (!data.ok) {
        setError(data.error ?? "Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      clearCart();

      // Zelle — show success then go to confirmation
      if (data.zelle) {
        pendingRedirect.current = `/order-confirmation?id=${data.orderId}&method=zelle`;
        setSuccessLabel("Order placed");
        return;
      }

      // 3DS required — redirect to Quiklie authentication page (no overlay — leaving site)
      if (data.requires3DS && data.redirectUrl) {
        if (!String(data.redirectUrl).startsWith("https://")) {
          setError("Payment could not be processed. Please try again.");
          setLoading(false);
          return;
        }
        window.location.href = data.redirectUrl;
        return;
      }

      // OTP required — show OTP input (no overlay — more steps needed)
      if (data.requiresOTP && data.transactionId) {
        setOtpState({ transactionId: data.transactionId, orderId: data.orderId });
        setLoading(false);
        return;
      }

      // Direct card success — show success then go to confirmation
      pendingRedirect.current = `/order-confirmation?id=${data.orderId}&method=card`;
      setSuccessLabel("Payment confirmed");

    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── OTP Submit ────────────────────────────────────────────────────────────
  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpState) return;
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/quiklie/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: otpState.transactionId,
          otp: otpValue,
          orderId: otpState.orderId,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtpError(data.error ?? "Invalid OTP. Please try again.");
        setOtpLoading(false);
        return;
      }
      pendingRedirect.current = `/order-confirmation?id=${otpState.orderId}`;
      setSuccessLabel("Payment confirmed");
    } catch {
      setOtpError("Network error. Please try again.");
      setOtpLoading(false);
    }
  }

  // Auth gate — require account before checkout
  if (sessionChecked && !customer) {
    return (
      <div className="py-10 text-center space-y-6">
        <p className="font-mono text-accent text-xs tracking-[0.25em]">— ACCOUNT REQUIRED —</p>
        <h2 className="font-sans font-bold text-paper text-2xl">Sign in to place your order</h2>
        <p className="font-sans text-bone text-sm">
          An account is required to check out. It only takes a moment to create one.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/account/login?next=/checkout`}
            className="bg-accent text-obsidian font-semibold font-sans px-8 h-12 flex items-center justify-center hover:bg-accent/80 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href={`/account/signup?next=/checkout`}
            className="border border-accent text-accent font-sans font-semibold px-8 h-12 flex items-center justify-center hover:bg-accent/10 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Honeypot — hidden from real users, filled by bots */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* ── Order items ── */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— YOUR ORDER —</p>

        {items.length === 0 && (
          <p className="text-bone text-sm">
            Your cart is empty.{" "}
            <a href="/shop" className="text-accent hover:underline">Browse the catalog →</a>
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
                >−</button>
                <span className="h-8 w-10 border-y border-slate text-paper font-mono text-sm flex items-center justify-center">
                  {item.qty}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(item.product, item.strength, item.qty + 1)}
                  className="h-8 w-9 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-base flex items-center justify-center"
                  aria-label="Increase quantity"
                >+</button>
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
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-accent text-sm font-bold mb-2">$9.50</p>
              <button
                type="button"
                onClick={() => addItem({ product: BAC_WATER.product, strength: BAC_WATER.strength, price: BAC_WATER.price })}
                className="font-mono text-xs text-obsidian bg-accent px-4 py-2 hover:bg-accent/80 transition-colors tracking-wider"
              >Add +</button>
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
            {codeError && <p className="font-mono text-red-400 text-[11px] mt-2">{codeError}</p>}
            {appliedCode && (
              <p className="font-mono text-green-400 text-[11px] mt-2">
                ✓ Code <strong>{appliedCode}</strong> applied — {Math.round(discountRate * 100)}% off
              </p>
            )}
          </div>
        )}

        {/* ── Order totals ── */}
        {items.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate pt-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-bone text-xs tracking-wider uppercase">Subtotal</span>
              <span className="font-mono text-bone text-sm">{fmtPrice(rawSubtotal)}</span>
            </div>

            {appliedCode && (
              <div className="flex justify-between items-center">
                <span className="font-mono text-green-400 text-xs tracking-wider uppercase">
                  Discount ({Math.round(discountRate * 100)}% — {appliedCode})
                </span>
                <span className="font-mono text-green-400 text-sm">−{fmtPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-mono text-bone text-xs tracking-wider uppercase">
                Shipping
                {shippingReady && (
                  <span className="ml-2 normal-case font-sans text-[10px] text-bone/50">
                    {shipping.label}
                  </span>
                )}
              </span>
              <span className="font-mono text-bone text-sm">
                {shippingReady ? fmtPrice(shipping.cost) : (
                  <span className="text-bone/40 text-xs">Enter city & state</span>
                )}
              </span>
            </div>

            {paymentMethod === "card" && shippingReady && (
              <div className="flex justify-between items-center">
                <span className="font-mono text-bone/60 text-xs tracking-wider uppercase">
                  Card Processing (4%)
                </span>
                <span className="font-mono text-bone/60 text-sm">{fmtPrice(processingFee)}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-slate pt-3 mt-1">
              <span className="font-mono text-bone text-xs tracking-wider uppercase">Order Total</span>
              <span className="font-mono text-accent text-xl font-bold">
                {shippingReady ? fmtPrice(orderTotal) : fmtPrice(afterDiscount) + " + shipping"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Logged-in banner */}
      {customer && (
        <div className="flex items-center justify-between bg-green-400/5 border border-green-400/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-green-400 shrink-0">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
            <p className="font-mono text-green-400 text-[10px] tracking-wider">
              Signed in as <span className="text-green-300">{customer.name}</span>
            </p>
          </div>
          <Link href="/account" className="font-mono text-green-400/60 text-[10px] hover:text-green-400 transition-colors">
            My Account →
          </Link>
        </div>
      )}

      {/* ── Customer info ── */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-6">— YOUR DETAILS —</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" name="name" value={form.name} onChange={handleField} />
          <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleField} />
          <Field label="Phone (optional — for delivery notifications only)" name="phone" type="tel" value={form.phone} onChange={handleField} />
        </div>
      </div>

      {/* ── Shipping address ── */}
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

        {/* Live shipping preview under address */}
        {shippingReady && (
          <div className="mt-4 flex items-center gap-3 bg-carbon border border-slate px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent shrink-0">
              <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
            <div className="flex-1">
              <span className="font-mono text-accent text-xs tracking-wider">{shipping.label}</span>
              <span className="font-mono text-bone/50 text-xs ml-2">· Next business day</span>
            </div>
            <span className="font-mono text-accent text-sm font-bold">{fmtPrice(shipping.cost)}</span>
          </div>
        )}
        {/* Friday / weekend shipping disclaimer */}
        <p className="font-mono text-bone/40 text-[10px] mt-2 leading-relaxed tracking-wider">
          Orders are sent out the next business day after ordering. Orders placed on Fridays or weekends will ship the following Monday. No weekend shipping.
        </p>
      </div>

      {/* ── Notes ── */}
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

      {/* ── Payment method ── */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-6">— PAYMENT METHOD —</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`border p-4 text-left transition-colors ${
              paymentMethod === "card"
                ? "border-accent bg-accent/10"
                : "border-slate hover:border-accent/50"
            }`}
          >
            <p className={`font-mono text-xs tracking-wider uppercase mb-1 ${paymentMethod === "card" ? "text-accent" : "text-bone"}`}>
              💳 Credit / Debit Card
            </p>
            <p className="font-sans text-bone/50 text-xs">Visa, Mastercard, Amex</p>
            <p className="font-mono text-bone/40 text-[10px] mt-1">+4% processing fee</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("zelle")}
            className={`border p-4 text-left transition-colors ${
              paymentMethod === "zelle"
                ? "border-accent bg-accent/10"
                : "border-slate hover:border-accent/50"
            }`}
          >
            <p className={`font-mono text-xs tracking-wider uppercase mb-1 ${paymentMethod === "zelle" ? "text-accent" : "text-bone"}`}>
              📲 Zelle
            </p>
            <p className="font-sans text-bone/50 text-xs">No processing fee</p>
          </button>
        </div>
      </div>

      {/* ── Payment details (card only) ── */}
      {paymentMethod === "card" && <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-6">— CARD DETAILS —</p>

        {/* Saved card option */}
        {savedPayment && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setUseSavedCard(!useSavedCard)}
              className={`w-full flex items-center gap-4 border p-4 text-left transition-colors ${
                useSavedCard ? "border-accent bg-accent/5" : "border-slate hover:border-accent/40"
              }`}
            >
              <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${useSavedCard ? "border-accent" : "border-slate"}`}>
                {useSavedCard && <div className="w-2 h-2 bg-accent" />}
              </div>
              <div>
                <p className="font-mono text-xs tracking-wider text-paper">
                  {savedPayment.brand.toUpperCase()} ···· {savedPayment.last4}
                </p>
                <p className="font-mono text-bone/50 text-[10px] mt-0.5">
                  Expires {savedPayment.expiryMonth}/{savedPayment.expiryYear} · Saved card
                </p>
              </div>
            </button>
            {useSavedCard && (
              <p className="font-mono text-bone/40 text-[10px] mt-2 tracking-wider">Using saved card — or{" "}
                <button type="button" onClick={() => setUseSavedCard(false)} className="text-accent hover:underline">
                  enter a different card
                </button>
              </p>
            )}
          </div>
        )}

        {/* Manual card entry — only shown when not using saved card */}
        {!useSavedCard && (<>
        <div className="mb-4">
          <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
            Card Number *
          </label>
          <div className="relative">
            <input
              type="text"
              name="number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={card.number}
              onChange={handleCardNumber}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors pr-24"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="font-mono text-bone/30 text-[10px] tracking-widest">VISA</span>
              <span className="font-mono text-bone/30 text-[10px] tracking-widest">MC</span>
              <span className="font-mono text-bone/30 text-[10px] tracking-widest">AMEX</span>
            </span>
          </div>
        </div>

        {/* Cardholder name */}
        <div className="mb-4">
          <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
            Cardholder Name *
          </label>
          <input
            type="text"
            name="holderName"
            autoComplete="cc-name"
            value={card.holderName}
            onChange={handleCardField}
            placeholder="Name as it appears on card"
            className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
              Month *
            </label>
            <select
              name="expiryMonth"
              value={card.expiryMonth}
              onChange={handleCardField}
              className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-11 focus:outline-none focus:border-accent transition-colors appearance-none"
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m).padStart(2, "0")}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
              Year *
            </label>
            <select
              name="expiryYear"
              value={card.expiryYear}
              onChange={handleCardField}
              className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-11 focus:outline-none focus:border-accent transition-colors appearance-none"
            >
              <option value="">YYYY</option>
              {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
              CVV *
            </label>
            <input
              type="text"
              name="cvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={card.cvv}
              onChange={handleCardField}
              placeholder="123"
              maxLength={4}
              className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        </>)}

        {/* Security note */}
        <div className="mt-4 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-accent/60 shrink-0">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
          <p className="font-mono text-bone/40 text-[10px] tracking-wider">
            256-BIT SSL ENCRYPTED · AES-256 SECURE STORAGE
          </p>
        </div>

        {/* Save card opt-in (only for logged-in customers entering a new card) */}
        {!useSavedCard && customer && (
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="font-mono text-bone/60 text-xs tracking-wider">Save card to my account for next time</span>
          </label>
        )}
      </div>}

      {/* ── Disclaimer ── */}
      <div className="bg-carbon border border-slate p-4">
        <p className="font-mono text-white/40 text-[11px] tracking-widest uppercase leading-relaxed">
          By placing this order you confirm all products are for in-vitro research use only — not for diagnostic, clinical, or other regulated applications.
          Payment is processed securely via Visa, Mastercard, or Amex. A 4% card processing fee is included in your total.
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
        {loading
          ? paymentMethod === "card" ? "Processing payment..." : "Placing order..."
          : paymentMethod === "zelle"
          ? shippingReady
            ? `Place Order — Pay via Zelle (${fmtPrice(orderTotal)})`
            : `Place Order — Pay via Zelle`
          : shippingReady
          ? `Pay with Card — ${fmtPrice(orderTotal)}`
          : `Pay with Card — ${fmtPrice(afterDiscount)} + shipping`}
      </button>

      {/* ── OTP Modal ── */}
      {otpState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-obsidian border border-slate w-full max-w-sm p-8">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-2">— VERIFICATION REQUIRED —</p>
            <h2 className="font-sans text-paper text-xl font-semibold mb-2">Enter Your OTP</h2>
            <p className="font-sans text-bone text-sm mb-6">
              Your bank sent a one-time password to your registered phone or email. Enter it below to complete your purchase.
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">
                  One-Time Password *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="e.g. 123456"
                  autoFocus
                  className="w-full bg-carbon border border-slate text-paper placeholder-bone/30 font-mono text-lg tracking-[0.3em] text-center px-4 h-14 focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {otpError && (
                <p className="font-mono text-red-400 text-[11px] border border-red-400/30 bg-red-400/10 px-3 py-2">
                  {otpError}
                </p>
              )}

              <button
                type="submit"
                disabled={otpLoading || otpValue.length < 4}
                className="w-full bg-accent text-obsidian font-semibold h-12 text-sm hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? "Verifying…" : "Verify & Complete Order"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpState(null);
                  setOtpValue("");
                  setOtpError("");
                }}
                className="w-full font-mono text-bone/50 text-xs hover:text-bone transition-colors py-2"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Success transition overlay — shown after a successful order */}
      {successLabel && (
        <SuccessTransition label={successLabel} onComplete={handleSuccessComplete} />
      )}
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

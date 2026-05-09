"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  product: string;
  strength: string;
  price: string;
  qty: number;
};

function parsePrice(p: string): number {
  const n = parseFloat(p.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatTotal(items: Item[]): string {
  const t = items.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0);
  return `$${t.toFixed(2)}`;
}

export default function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();

  const initialItem: Item = {
    product: params.get("product") ?? "",
    strength: params.get("strength") ?? "",
    price: params.get("price") ?? "",
    qty: 1,
  };

  const [items, setItems] = useState<Item[]>(
    initialItem.product ? [initialItem] : []
  );
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

  function setQty(idx: number, qty: number) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, qty) } : it))
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!items.length) {
      setError("No items in your order.");
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
          items,
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Unknown error");

      router.push(`/order-confirmation?id=${data.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const total = formatTotal(items);

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Order items */}
      <div>
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— YOUR ORDER —</p>

        {items.length === 0 && (
          <p className="text-bone text-sm">
            No items selected.{" "}
            <a href="/shop" className="text-accent hover:underline">
              Browse the catalog →
            </a>
          </p>
        )}

        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 bg-carbon border border-slate p-4 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans font-semibold text-paper text-sm truncate">{item.product}</p>
              <p className="font-mono text-accent text-xs mt-0.5">{item.strength}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(idx, item.qty - 1)}
                className="h-8 w-8 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="font-mono text-paper text-sm w-6 text-center">{item.qty}</span>
              <button
                type="button"
                onClick={() => setQty(idx, item.qty + 1)}
                className="h-8 w-8 border border-slate text-paper hover:border-accent hover:text-accent transition-colors font-mono text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
            <span className="font-mono text-accent text-sm font-semibold w-20 text-right shrink-0">
              {item.price !== "" ? `$${(parsePrice(item.price) * item.qty).toFixed(2)}` : "—"}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-bone hover:text-accent transition-colors font-mono text-xs ml-2"
                aria-label="Remove item"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {items.length > 0 && (
          <div className="flex justify-between items-center border-t border-slate pt-4 mt-2">
            <span className="font-mono text-bone text-xs tracking-wider uppercase">Total</span>
            <span className="font-mono text-accent text-xl font-bold">{total}</span>
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
        {loading ? "Placing Order..." : `Place Order — ${total}`}
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

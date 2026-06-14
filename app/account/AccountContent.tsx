"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SuccessTransition from "@/components/SuccessTransition";
import type { CustomerAccount, CustomerAddress, SavedPayment } from "@/lib/customer-db";
import type { Order } from "@/lib/db";
import { useCart } from "@/lib/cart";

type Tab = "orders" | "addresses" | "payment" | "settings";

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  paid:            "bg-blue-500/20 text-blue-400 border-blue-500/40",
  fulfilled:       "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled:       "bg-red-500/20 text-red-400 border-red-500/40",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Processing",
  paid:            "Paid",
  fulfilled:       "Fulfilled",
  cancelled:       "Cancelled",
};

export default function AccountContent() {
  const router = useRouter();
  const { addItem } = useCart();

  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [savedPayment, setSavedPayment] = useState<Pick<SavedPayment, "last4"|"brand"|"expiryMonth"|"expiryYear"> | null>(null);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [tab, setTab]           = useState<Tab>("orders");
  const [loading, setLoading]   = useState(true);
  const [successLabel, setSuccessLabel] = useState("");
  const pendingAction = useCallback((label: string) => setSuccessLabel(label), []);

  // Settings form
  const [settingsName, setSettingsName]     = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [currentPw, setCurrentPw]           = useState("");
  const [newPw, setNewPw]                   = useState("");
  const [confirmPw, setConfirmPw]           = useState("");
  const [settingsErr, setSettingsErr]       = useState("");
  const [settingsWorking, setSettingsWorking] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw]     = useState("");
  const [deleteErr, setDeleteErr]   = useState("");
  const [deleting, setDeleting]     = useState(false);

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({ line1: "", city: "", state: "", zip: "", isDefault: false });
  const [addrWorking, setAddrWorking] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/customer/me");
      if (!meRes.ok) { router.replace("/account/login"); return; }
      const me = await meRes.json();
      setCustomer(me.customer);
      setSavedPayment(me.savedPayment ?? null);
      setSettingsName(me.customer.name);
      setMarketingOptIn(me.customer.marketingOptIn);

      const ordRes = await fetch("/api/customer/orders");
      if (ordRes.ok) {
        const od = await ordRes.json();
        setOrders(od.orders ?? []);
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    router.push("/");
  }

  async function handleReorder(order: Order) {
    order.items.forEach((item) => addItem({ product: item.product, strength: item.strength, price: item.price }));
    router.push("/checkout");
  }

  async function handleSaveProfile() {
    setSettingsErr("");
    setSettingsWorking(true);
    const res = await fetch("/api/customer/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_profile", name: settingsName, marketingOptIn }),
    });
    const data = await res.json();
    setSettingsWorking(false);
    if (!data.ok) { setSettingsErr(data.error ?? "Failed to save."); return; }
    setCustomer(data.customer);
    pendingAction("Saved");
  }

  async function handleChangePassword() {
    setSettingsErr("");
    if (newPw !== confirmPw) { setSettingsErr("Passwords do not match."); return; }
    if (newPw.length < 8) { setSettingsErr("Password must be at least 8 characters."); return; }
    setSettingsWorking(true);
    const res = await fetch("/api/customer/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_password", currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setSettingsWorking(false);
    if (!data.ok) { setSettingsErr(data.error ?? "Failed."); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    pendingAction("Password updated");
  }

  async function handleDeleteAccount() {
    setDeleteErr("");
    setDeleting(true);
    const res = await fetch("/api/customer/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePw }),
    });
    const data = await res.json();
    setDeleting(false);
    if (!data.ok) { setDeleteErr(data.error ?? "Failed."); return; }
    router.push("/");
  }

  async function handleAddAddress() {
    setAddrWorking(true);
    const res = await fetch("/api/customer/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addrForm),
    });
    const data = await res.json();
    setAddrWorking(false);
    if (!data.ok) return;
    setCustomer((c) => c ? { ...c, addresses: [...c.addresses, data.address] } : c);
    setShowAddrForm(false);
    setAddrForm({ line1: "", city: "", state: "", zip: "", isDefault: false });
    pendingAction("Address saved");
  }

  async function handleDeleteAddr(id: string) {
    await fetch("/api/customer/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: id }),
    });
    setCustomer((c) => c ? { ...c, addresses: c.addresses.filter((a) => a.id !== id) } : c);
  }

  async function handleSetDefault(id: string) {
    await fetch("/api/customer/addresses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: id }),
    });
    setCustomer((c) => c ? {
      ...c,
      addresses: c.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    } : c);
  }

  async function handleDeletePayment() {
    await fetch("/api/customer/payment", { method: "DELETE" });
    setSavedPayment(null);
    pendingAction("Card removed");
  }

  async function handleResendVerification() {
    await fetch("/api/customer/resend-verification", { method: "POST" });
    pendingAction("Verification email sent");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-40 h-px bg-slate overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-accent to-transparent loading-scan" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const initials = customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/30 flex items-center justify-center font-mono text-accent text-sm font-bold">
              {initials}
            </div>
            <div>
              <h1 className="font-sans font-bold text-paper text-xl leading-tight">{customer.name}</h1>
              <p className="font-mono text-bone text-xs mt-0.5">{customer.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-bone/50 text-xs hover:text-bone transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Verification banner */}
        {!customer.emailVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="font-mono text-yellow-400 text-xs tracking-wider">
              Email not verified — check your inbox to unlock ordering.
            </p>
            <button
              onClick={handleResendVerification}
              className="font-mono text-yellow-400 text-xs hover:underline"
            >
              Resend →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate mb-8 overflow-x-auto no-scrollbar">
          {(["orders","addresses","payment","settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-xs tracking-[0.15em] uppercase px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                tab === t ? "text-accent border-accent" : "text-bone/50 border-transparent hover:text-bone"
              }`}
            >
              {t === "orders" ? "Order History" : t === "addresses" ? "Addresses" : t === "payment" ? "Payment" : "Settings"}
            </button>
          ))}
        </div>

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-mono text-bone/40 text-sm mb-4">No orders yet.</p>
                <Link href="/shop" className="font-mono text-accent text-sm hover:underline">Browse the catalog →</Link>
              </div>
            ) : orders.map((order) => (
              <div key={order.id} className="bg-carbon border border-slate p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <p className="font-mono text-accent text-xs tracking-wider mb-1">#{order.id.toUpperCase()}</p>
                    <p className="font-sans text-paper text-sm font-semibold">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_BADGE[order.status] ?? ""}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className="font-mono text-accent text-sm font-bold">{order.orderTotal ?? order.subtotal}</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  {order.items.map((item, i) => (
                    <p key={i} className="font-sans text-bone text-sm">
                      {item.product} <span className="text-bone/50">· {item.strength} · ×{item.qty}</span>
                    </p>
                  ))}
                </div>

                <button
                  onClick={() => handleReorder(order)}
                  className="font-mono text-xs text-obsidian bg-accent px-5 py-2 hover:bg-accent/80 transition-colors tracking-wider"
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Addresses ── */}
        {tab === "addresses" && (
          <div className="space-y-4">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="bg-carbon border border-slate p-5 flex items-start justify-between gap-4">
                <div>
                  {addr.isDefault && (
                    <span className="font-mono text-[9px] text-accent border border-accent/30 px-2 py-0.5 tracking-wider mb-2 inline-block">
                      DEFAULT
                    </span>
                  )}
                  <p className="font-sans text-paper text-sm">{addr.line1}</p>
                  <p className="font-sans text-bone text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="font-mono text-accent text-xs hover:underline">
                      Set default
                    </button>
                  )}
                  <button onClick={() => handleDeleteAddr(addr.id)} className="font-mono text-bone/40 text-xs hover:text-red-400 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {!showAddrForm ? (
              <button
                onClick={() => setShowAddrForm(true)}
                className="font-mono text-accent text-xs border border-accent/30 px-5 py-3 hover:bg-accent/5 transition-colors tracking-wider w-full"
              >
                + Add Address
              </button>
            ) : (
              <div className="bg-carbon border border-slate p-5 space-y-4">
                <p className="font-mono text-accent text-xs tracking-wider">New Address</p>
                {(
                  [
                    { label: "Street Address", key: "line1" },
                    { label: "City",           key: "city"  },
                    { label: "State",          key: "state" },
                    { label: "ZIP Code",       key: "zip"   },
                  ] as const
                ).map(({ label, key }) => (
                  <div key={key}>
                    <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">{label}</label>
                    <input
                      type="text"
                      value={addrForm[key]}
                      onChange={(e) => setAddrForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-obsidian border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={(e) => setAddrForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="font-mono text-bone text-xs tracking-wider">Set as default</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddAddress}
                    disabled={addrWorking}
                    className="bg-accent text-obsidian font-semibold font-mono text-xs px-6 py-2.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                  >
                    {addrWorking ? "Saving…" : "Save Address"}
                  </button>
                  <button onClick={() => setShowAddrForm(false)} className="font-mono text-bone/50 text-xs hover:text-bone transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Payment ── */}
        {tab === "payment" && (
          <div>
            {savedPayment ? (
              <div className="bg-carbon border border-slate p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-mono text-bone/50 text-[10px] tracking-wider uppercase mb-1">Saved Card</p>
                  <p className="font-sans text-paper text-sm font-semibold">
                    {savedPayment.brand.toUpperCase()} ···· {savedPayment.last4}
                  </p>
                  <p className="font-mono text-bone text-xs mt-0.5">
                    Expires {savedPayment.expiryMonth}/{savedPayment.expiryYear}
                  </p>
                </div>
                <button
                  onClick={handleDeletePayment}
                  className="font-mono text-bone/40 text-xs hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="font-mono text-bone/40 text-sm mb-2">No saved payment method.</p>
                <p className="font-sans text-bone/30 text-xs">Check the &ldquo;Save card&rdquo; option at checkout to store your card here.</p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-accent/60 shrink-0">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
              <p className="font-mono text-bone/30 text-[10px] tracking-wider">AES-256 ENCRYPTED · ONLY LAST 4 DIGITS DISPLAYED</p>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <div className="space-y-8 max-w-lg">
            {/* Profile */}
            <div>
              <p className="font-mono text-accent text-xs tracking-wider mb-4">Profile</p>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">Email</label>
                  <input
                    type="text"
                    value={customer.email}
                    disabled
                    className="w-full bg-carbon border border-slate text-bone/40 font-sans text-sm px-4 h-11 cursor-not-allowed"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                  <span className="font-sans text-bone text-sm">Email me about new products and promotions</span>
                </label>
                <button
                  onClick={handleSaveProfile}
                  disabled={settingsWorking}
                  className="bg-accent text-obsidian font-semibold font-mono text-xs px-6 py-2.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {settingsWorking ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </div>

            <hr className="border-slate" />

            {/* Password */}
            <div>
              <p className="font-mono text-accent text-xs tracking-wider mb-4">Change Password</p>
              <div className="space-y-4">
                {[
                  { label: "Current Password", val: currentPw, set: setCurrentPw },
                  { label: "New Password",     val: newPw,     set: setNewPw     },
                  { label: "Confirm New",       val: confirmPw, set: setConfirmPw },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="block font-mono text-bone text-xs tracking-wider uppercase mb-2">{label}</label>
                    <input
                      type="password"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                ))}
                {settingsErr && (
                  <p className="font-mono text-red-400 text-xs border border-red-400/30 bg-red-400/10 px-4 py-3">{settingsErr}</p>
                )}
                <button
                  onClick={handleChangePassword}
                  disabled={settingsWorking || !currentPw || !newPw || !confirmPw}
                  className="bg-accent text-obsidian font-semibold font-mono text-xs px-6 py-2.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {settingsWorking ? "Updating…" : "Update Password"}
                </button>
              </div>
            </div>

            <hr className="border-slate" />

            {/* Danger zone */}
            <div>
              <p className="font-mono text-red-400/70 text-xs tracking-wider mb-4">Danger Zone</p>
              <p className="font-sans text-bone/50 text-sm mb-4">
                Permanently delete your account and all personal data. Your order history will be anonymized.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="font-mono text-red-400 text-xs border border-red-400/30 px-5 py-2.5 hover:bg-red-400/10 transition-colors tracking-wider"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-obsidian border border-red-400/30 w-full max-w-sm p-8">
            <p className="font-mono text-red-400 text-xs tracking-wider mb-2">— CONFIRM DELETION —</p>
            <h2 className="font-sans text-paper text-xl font-bold mb-4">Delete your account?</h2>
            <p className="font-sans text-bone text-sm mb-6">
              This is permanent. Enter your password to confirm.
            </p>
            <input
              type="password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              placeholder="Your password"
              className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-red-400 transition-colors mb-4"
            />
            {deleteErr && (
              <p className="font-mono text-red-400 text-xs mb-4">{deleteErr}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePw}
                className="flex-1 bg-red-500 text-white font-semibold font-mono text-xs h-11 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                onClick={() => { setShowDelete(false); setDeletePw(""); setDeleteErr(""); }}
                className="font-mono text-bone/50 text-xs px-4 hover:text-bone transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successLabel && (
        <SuccessTransition
          label={successLabel}
          holdMs={800}
          onComplete={() => setSuccessLabel("")}
        />
      )}
    </>
  );
}

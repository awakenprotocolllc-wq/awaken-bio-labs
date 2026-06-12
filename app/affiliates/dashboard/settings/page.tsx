"use client";

import { useEffect, useState } from "react";
import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { getCurrentUser, type AffiliateUser } from "@/lib/affiliate-auth";

type PayoutInfo = {
  holderName: string;
  bankName: string;
  routingNumber: string;
  accountLast4: string;
  accountType: "checking" | "savings";
  updatedAt: string;
} | null;

export default function SettingsPage() {
  const [user, setUser] = useState<AffiliateUser | null>(null);

  // Payout form state
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo>(null);
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSaved, setPayoutSaved] = useState(false);

  // Password form state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSaved, setPassSaved] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    // Load existing payout info (masked)
    fetch("/api/affiliate/payout-info")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.info) {
          setPayoutInfo(data.info);
          setHolderName(data.info.holderName);
          setBankName(data.info.bankName ?? "");
          setAccountType(data.info.accountType);
        }
      });
  }, []);

  async function handlePayoutSave(e: React.FormEvent) {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSaving(true);
    try {
      const res = await fetch("/api/affiliate/payout-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holderName, bankName, routingNumber, accountNumber, accountType }),
      });
      const data = await res.json();
      if (data.ok) {
        setPayoutSaved(true);
        setRoutingNumber("");
        setAccountNumber("");
        // Refresh masked info
        const refreshed = await fetch("/api/affiliate/payout-info").then((r) => r.json());
        if (refreshed.ok && refreshed.info) setPayoutInfo(refreshed.info);
        setTimeout(() => setPayoutSaved(false), 3000);
      } else {
        setPayoutError(data.error ?? "Failed to save.");
      }
    } finally {
      setPayoutSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPassError(null);
    if (newPass.length < 6) { setPassError("New password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setPassError("Passwords do not match."); return; }
    setPassSaving(true);
    try {
      const res = await fetch("/api/affiliate/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.ok) {
        setPassSaved(true);
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
        setTimeout(() => setPassSaved(false), 3000);
      } else {
        setPassError(data.error ?? "Failed to update password.");
      }
    } finally {
      setPassSaving(false);
    }
  }

  return (
    <AffiliateDashboardShell title="Settings.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Payout Method */}
          <form onSubmit={handlePayoutSave} className="bg-carbon border border-slate p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-sans font-bold text-paper text-xl">Payout method</h2>
              {payoutInfo ? (
                <p className="font-mono text-[10px] text-accent tracking-wider mt-1">
                  On file: {payoutInfo.accountType} ****{payoutInfo.accountLast4} —{" "}
                  {payoutInfo.holderName}
                  {payoutInfo.bankName ? ` · ${payoutInfo.bankName}` : ""}
                </p>
              ) : (
                <p className="font-mono text-[10px] text-bone/50 tracking-wider mt-1">
                  No payout info on file yet.
                </p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Account Holder Name *</label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                required
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Chase, Wells Fargo"
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Routing Number * (9 digits)</label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="••••••••• (re-enter to update)"
                maxLength={9}
                className="w-full bg-obsidian border border-slate text-paper font-mono px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none tracking-widest transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Account Number * (re-enter to update)</label>
              <input
                type="password"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={payoutInfo ? `Currently: ****${payoutInfo.accountLast4}` : "Account number"}
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Account Type *</label>
              <div className="flex gap-4">
                {(["checking", "savings"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountType"
                      value={t}
                      checked={accountType === t}
                      onChange={() => setAccountType(t)}
                      className="accent-accent"
                    />
                    <span className="font-mono text-sm text-paper capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {payoutError && <p className="font-mono text-[10px] text-red-400">{payoutError}</p>}
            <p className="font-mono text-[10px] text-bone/40">
              Your banking information is stored securely and only visible to Awaken Bio Labs staff for payout processing.
            </p>
            <button
              type="submit"
              disabled={payoutSaving}
              className="border border-accent text-accent font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {payoutSaved ? "✓ Saved" : payoutSaving ? "Saving…" : "Save Payout Info"}
            </button>
          </form>

          {/* Password */}
          <form onSubmit={handlePasswordSave} className="bg-carbon border border-slate p-6 sm:p-8 space-y-5">
            <h2 className="font-sans font-bold text-paper text-xl">Security</h2>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Current Password</label>
              <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">New Password</label>
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">Confirm New Password</label>
              <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required
                className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors" />
            </div>
            {passError && <p className="font-mono text-[10px] text-red-400">{passError}</p>}
            <button
              type="submit"
              disabled={passSaving}
              className="border border-accent text-accent font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {passSaved ? "✓ Updated" : passSaving ? "Saving…" : "Update Password"}
            </button>
          </form>
        </div>

        {/* Side card */}
        <aside className="space-y-6">
          <div className="bg-carbon border-t-4 border-accent border-x border-b border-x-slate border-b-slate p-6">
            <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-3">— ACCOUNT —</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Name</dt>
                <dd className="font-mono text-paper">{user?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Email</dt>
                <dd className="font-mono text-paper">{user?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Code</dt>
                <dd className="font-sans font-bold text-accent">{user?.affiliateCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Payout Info</dt>
                <dd className="font-mono text-paper text-xs">
                  {payoutInfo ? `✓ On file · ****${payoutInfo.accountLast4}` : "Not submitted yet"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-carbon border border-slate p-6">
            <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">— NEED HELP? —</p>
            <p className="text-bone text-sm leading-relaxed mb-4">
              Questions about payouts or your account — your partner manager replies within one business day.
            </p>
            <a href="mailto:affiliates@awakenbiolabs.com" className="font-mono text-xs text-accent hover:underline">
              affiliates@awakenbiolabs.com →
            </a>
          </div>
        </aside>
      </div>
    </AffiliateDashboardShell>
  );
}

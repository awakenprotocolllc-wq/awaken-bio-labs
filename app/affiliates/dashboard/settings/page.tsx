"use client";

import { useEffect, useState } from "react";
import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";
import { getCurrentUser, type AffiliateUser } from "@/lib/affiliate-auth";

export default function SettingsPage() {
  const [user, setUser] = useState<AffiliateUser | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AffiliateDashboardShell title="Settings.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Profile */}
          <form
            onSubmit={handleSave}
            className="bg-carbon border border-slate p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-sans font-bold text-paper text-xl">Profile</h2>
            <Field label="Full Name" defaultValue={user?.name ?? ""} />
            <Field label="Email" defaultValue={user?.email ?? ""} type="email" />
            <Field label="Primary Platform" placeholder="Instagram, YouTube, Site URL" />
            <Field label="Tax ID / EIN" placeholder="For 1099 reporting (US affiliates)" />
            <button
              type="submit"
              className="bg-accent text-obsidian font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/80 transition-colors"
            >
              {saved ? "✓ Saved" : "Save Profile"}
            </button>
          </form>

          {/* Payout */}
          <form
            onSubmit={handleSave}
            className="bg-carbon border border-slate p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-sans font-bold text-paper text-xl">Payout method</h2>
            <p className="font-mono text-[10px] text-bone tracking-wider uppercase">
              Currently on file: ACH · ****4421
            </p>
            <Field label="Bank Routing Number" placeholder="9-digit routing number" />
            <Field label="Bank Account Number" type="password" placeholder="Account number" />
            <Field label="Account Holder Name" />
            <button
              type="submit"
              className="border border-accent text-accent font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/10 transition-colors"
            >
              Update Payout Method
            </button>
          </form>

          {/* Password */}
          <form
            onSubmit={handleSave}
            className="bg-carbon border border-slate p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-sans font-bold text-paper text-xl">Security</h2>
            <Field label="Current Password" type="password" />
            <Field label="New Password" type="password" />
            <Field label="Confirm New Password" type="password" />
            <button
              type="submit"
              className="border border-accent text-accent font-semibold px-6 h-11 min-h-[44px] hover:bg-accent/10 transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Side card */}
        <aside className="space-y-6">
          <div className="bg-carbon border-t-4 border-accent border-x border-b border-x-slate border-b-slate p-6">
            <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-3">
              — ACCOUNT —
            </p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Affiliate ID</dt>
                <dd className="font-mono text-paper">{user?.id ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Code</dt>
                <dd className="font-sans font-bold text-accent">{user?.affiliateCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Commission</dt>
                <dd className="text-paper">25% of net sale</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Cookie Window</dt>
                <dd className="text-paper">60 days</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-bone tracking-wider uppercase">Payout Cadence</dt>
                <dd className="text-paper">1st &amp; 15th, monthly</dd>
              </div>
            </dl>
          </div>

          <div className="bg-carbon border border-slate p-6">
            <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">
              — NEED HELP? —
            </p>
            <p className="text-bone text-sm leading-relaxed mb-4">
              Affiliate-specific questions, code customization, co-marketing — your
              dedicated partner manager replies within one business day.
            </p>
            <a
              href="mailto:affiliates@awakenbiolabs.com"
              className="font-mono text-xs text-accent hover:underline"
            >
              affiliates@awakenbiolabs.com →
            </a>
          </div>
        </aside>
      </div>
    </AffiliateDashboardShell>
  );
}

function Field({
  label,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
      />
    </div>
  );
}

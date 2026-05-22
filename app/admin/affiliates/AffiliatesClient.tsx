"use client";

import { useState } from "react";
import Link from "next/link";
import type { AffiliateApplication, AffiliateAccount } from "@/lib/affiliate-db";

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  approved:         "bg-green-500/20 text-green-400 border-green-500/40",
  denied:           "bg-red-500/20 text-red-400 border-red-500/40",
  active:           "bg-green-500/20 text-green-400 border-green-500/40",
  pending_contract: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  suspended:        "bg-red-500/20 text-red-400 border-red-500/40",
};

const STATUS_LABEL: Record<string, string> = {
  active:           "ACTIVE",
  pending_contract: "PENDING CONTRACT",
  suspended:        "SUSPENDED",
};

const PROGRAM_BADGE: Record<string, string> = {
  ambassador: "bg-accent/10 text-accent border-accent/30",
  licensee:   "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

export default function AffiliatesClient({
  initialApplications,
  initialAffiliates,
}: {
  initialApplications: AffiliateApplication[];
  initialAffiliates: AffiliateAccount[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [affiliates, setAffiliates] = useState(initialAffiliates);
  const [activeTab, setActiveTab] = useState<"ambassadors" | "licensees">("ambassadors");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState<{
    id: string; password: string; code: string; rate: string; programType: "ambassador" | "licensee";
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  async function handleDeny(id: string) {
    setWorking(id);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deny" }),
    });
    if ((await res.json()).ok) {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: "denied" as const } : a));
    }
    setWorking(null);
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approveForm) return;
    setWorking(approveForm.id);

    const res = await fetch(`/api/admin/affiliates/${approveForm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        password: approveForm.password,
        affiliateCode: approveForm.code,
        commissionRate: parseFloat(approveForm.rate) / 100,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      setApplications((prev) => prev.map((a) => a.id === approveForm.id ? { ...a, status: "approved" as const } : a));
      setAffiliates((prev) => [...prev, data.account]);
      setApproveForm(null);
    }
    setWorking(null);
  }

  async function handleSuspend(id: string) {
    setWorking(id);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend" }),
    });
    if ((await res.json()).ok) {
      setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, status: "suspended" as const } : a));
    }
    setWorking(null);
  }

  async function handleReactivate(id: string) {
    setWorking(id);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate" }),
    });
    if ((await res.json()).ok) {
      setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, status: "active" as const } : a));
    }
    setWorking(null);
  }

  // ── Segment data ──────────────────────────────────────────────────────────
  const pending    = applications.filter((a) => a.status === "pending");
  const denied     = applications.filter((a) => a.status === "denied");

  const ambassadorApps  = pending.filter((a) => (a.programType ?? "ambassador") === "ambassador");
  const licenseeApps    = pending.filter((a) => a.programType === "licensee");
  const ambassadors     = affiliates.filter((a) => (a.programType ?? "ambassador") === "ambassador");
  const licensees       = affiliates.filter((a) => a.programType === "licensee");

  const tabPending = activeTab === "ambassadors" ? ambassadorApps : licenseeApps;
  const tabAccounts = activeTab === "ambassadors" ? ambassadors : licensees;

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Partner Program</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">Partners</span>
          </div>
        </div>
        <button onClick={handleLogout} className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
          Sign Out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending Review",     value: pending.length },
            { label: "Active Ambassadors", value: ambassadors.filter((a) => a.status === "active").length },
            { label: "Active Licensees",   value: licensees.filter((a) => a.status === "active").length },
            { label: "Suspended",          value: affiliates.filter((a) => a.status === "suspended").length },
          ].map((s) => (
            <div key={s.label} className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">{s.label}</p>
              <p className="font-sans font-bold text-paper text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Program tabs ── */}
        <div className="border-b border-slate">
          <div className="flex gap-0">
            {(["ambassadors", "licensees"] as const).map((tab) => {
              const count = tab === "ambassadors"
                ? ambassadorApps.length + ambassadors.length
                : licenseeApps.length + licensees.length;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setExpandedId(null); setApproveForm(null); }}
                  className={`font-mono text-xs tracking-[0.15em] uppercase px-6 py-3 border-b-2 transition-colors ${
                    activeTab === tab
                      ? tab === "ambassadors"
                        ? "border-accent text-accent"
                        : "border-purple-400 text-purple-300"
                      : "border-transparent text-bone hover:text-paper"
                  }`}
                >
                  {tab === "ambassadors" ? "Ambassadors" : "Licensees"}
                  <span className="ml-2 font-mono text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Commission info banner ── */}
        <div className={`border px-4 py-3 flex items-center gap-3 ${
          activeTab === "ambassadors"
            ? "border-accent/20 bg-accent/5"
            : "border-purple-500/20 bg-purple-500/5"
        }`}>
          <span className={`font-mono text-xs font-bold ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            {activeTab === "ambassadors" ? "20% commission" : "50% commission"}
          </span>
          <span className="text-bone text-xs font-mono">·</span>
          <span className="font-mono text-bone text-xs">
            {activeTab === "ambassadors"
              ? "20% of gross product subtotal · customers get 10% off"
              : "50% of gross product subtotal · customers get 10% off · rate is locked"}
          </span>
        </div>

        {/* ── Pending applications (current tab) ── */}
        <div>
          <p className={`font-mono text-xs tracking-[0.25em] mb-4 ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            — PENDING {activeTab === "ambassadors" ? "AMBASSADOR" : "LICENSEE"} APPLICATIONS ({tabPending.length}) —
          </p>

          {tabPending.length === 0 && (
            <p className="text-bone font-mono text-sm py-4">No pending applications.</p>
          )}

          <div className="space-y-3">
            {tabPending.map((app) => {
              const isExpanded = expandedId === app.id;
              const isApproving = approveForm?.id === app.id;
              const isLicensee = app.programType === "licensee";

              return (
                <div key={app.id} className="bg-carbon border border-slate">
                  <div
                    className="px-5 py-4 cursor-pointer hover:bg-slate/10 transition-colors grid grid-cols-[1fr_auto] sm:grid-cols-[200px_1fr_130px_auto] gap-3 items-center"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div>
                      <p className="font-sans font-semibold text-paper text-sm">{app.name}</p>
                      <p className="font-mono text-bone text-xs mt-0.5">{app.email}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-mono text-bone text-xs truncate">{app.platform}</p>
                      {app.audience && <p className="font-mono text-bone/50 text-[10px] mt-0.5">{app.audience}</p>}
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className={`font-mono text-[10px] px-2 py-0.5 border tracking-wider ${PROGRAM_BADGE[app.programType ?? "ambassador"]}`}>
                        {isLicensee ? "LICENSEE" : "AMBASSADOR"}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`text-bone transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate px-5 py-5 space-y-5">
                      {app.about && (
                        <div>
                          <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-2">ABOUT</p>
                          <p className="text-bone text-sm leading-relaxed">{app.about}</p>
                        </div>
                      )}
                      <div className="text-xs font-mono text-bone">
                        Applied: {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        <span className={`${PROGRAM_BADGE[app.programType ?? "ambassador"]} px-1.5 py-0.5 border font-mono text-[10px]`}>
                          {isLicensee ? "LICENSEE · 50%" : "AMBASSADOR · 20%"}
                        </span>
                      </div>

                      {!isApproving ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setApproveForm({
                              id: app.id,
                              password: "",
                              code: app.name.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "PARTNER",
                              rate: isLicensee ? "50" : "20",
                              programType: app.programType ?? "ambassador",
                            })}
                            className="bg-accent text-obsidian font-semibold font-mono text-xs tracking-wider px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeny(app.id)}
                            disabled={working === app.id}
                            className="border border-red-500/40 text-red-400 font-mono text-xs tracking-wider px-5 h-10 min-h-[44px] hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApprove} className="space-y-4 bg-obsidian border border-slate p-5">
                          <p className="font-mono text-accent text-[10px] tracking-[0.2em]">
                            — SET UP {isLicensee ? "LICENSEE" : "AMBASSADOR"} ACCOUNT —
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">Affiliate Code</label>
                              <input
                                type="text"
                                value={approveForm.code}
                                onChange={(e) => setApproveForm((f) => f && { ...f, code: e.target.value.toUpperCase() })}
                                maxLength={12}
                                className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors uppercase"
                              />
                            </div>
                            <div>
                              <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">
                                Commission %
                                {isLicensee && <span className="ml-1 text-purple-400">(locked)</span>}
                              </label>
                              {isLicensee ? (
                                <div className="w-full bg-carbon border border-purple-500/30 text-purple-300 font-mono text-sm px-3 h-10 flex items-center">
                                  50% — Licensee Rate
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={approveForm.rate}
                                  onChange={(e) => setApproveForm((f) => f && { ...f, rate: e.target.value })}
                                  min={1}
                                  max={30}
                                  className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors"
                                />
                              )}
                            </div>
                            <div>
                              <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">Password *</label>
                              <input
                                type="text"
                                placeholder="min 6 chars"
                                value={approveForm.password}
                                onChange={(e) => setApproveForm((f) => f && { ...f, password: e.target.value })}
                                className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent transition-colors"
                              />
                            </div>
                          </div>
                          <p className="font-mono text-bone/50 text-[10px] leading-relaxed">
                            Partner will receive a contract signing link at {app.email}. Credentials are sent automatically after they sign.
                          </p>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={working === approveForm.id}
                              className="bg-accent text-obsidian font-semibold font-mono text-xs tracking-wider px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
                            >
                              {working === approveForm.id ? "Creating…" : "Send Contract →"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setApproveForm(null)}
                              className="border border-slate text-bone font-mono text-xs tracking-wider px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Accounts (current tab) ── */}
        <div>
          <p className={`font-mono text-xs tracking-[0.25em] mb-4 ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            — {activeTab === "ambassadors" ? "AMBASSADOR" : "LICENSEE"} ACCOUNTS ({tabAccounts.length}) —
          </p>

          {tabAccounts.length === 0 && (
            <p className="text-bone font-mono text-sm py-4">No {activeTab} yet.</p>
          )}

          <div className="space-y-3">
            {tabAccounts.map((aff) => (
              <div key={aff.id} className="bg-carbon border border-slate px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_140px_110px_130px_auto] gap-3 items-center">
                <div>
                  <p className="font-sans font-semibold text-paper text-sm">{aff.name}</p>
                  <p className="font-mono text-bone text-xs mt-0.5">{aff.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-accent text-sm font-bold">{aff.affiliateCode}</span>
                  <button
                    onClick={() => copyText(aff.affiliateCode)}
                    className="font-mono text-[10px] text-bone hover:text-accent transition-colors"
                    title="Copy code"
                  >
                    {copied === aff.affiliateCode ? "✓" : "⎘"}
                  </button>
                </div>

                <div>
                  <span className={`font-mono text-xs font-bold ${aff.programType === "licensee" ? "text-purple-300" : "text-accent"}`}>
                    {Math.round((aff.commissionRate ?? 0.20) * 100)}%
                  </span>
                  <span className="font-mono text-bone/50 text-[10px] ml-1">commission</span>
                </div>

                <div>
                  <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_COLORS[aff.status]}`}>
                    {STATUS_LABEL[aff.status] ?? aff.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex gap-2">
                  {aff.status === "active" && (
                    <button
                      onClick={() => handleSuspend(aff.id)}
                      disabled={working === aff.id}
                      className="font-mono text-[10px] tracking-wider text-red-400 border border-red-500/30 px-3 py-1.5 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      Suspend
                    </button>
                  )}
                  {aff.status === "suspended" && (
                    <button
                      onClick={() => handleReactivate(aff.id)}
                      disabled={working === aff.id}
                      className="font-mono text-[10px] tracking-wider text-green-400 border border-green-500/30 px-3 py-1.5 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Denied applications ── */}
        {denied.length > 0 && (
          <div>
            <p className="font-mono text-bone text-xs tracking-[0.25em] mb-4">— DENIED APPLICATIONS —</p>
            <div className="space-y-2">
              {denied.map((app) => (
                <div key={app.id} className="bg-carbon border border-slate px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-sans text-sm text-bone">{app.name}</p>
                    <p className="font-mono text-bone/50 text-xs">{app.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] px-2 py-0.5 border tracking-wider ${PROGRAM_BADGE[app.programType ?? "ambassador"]}`}>
                      {app.programType === "licensee" ? "LICENSEE" : "AMBASSADOR"}
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_COLORS.denied}`}>DENIED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

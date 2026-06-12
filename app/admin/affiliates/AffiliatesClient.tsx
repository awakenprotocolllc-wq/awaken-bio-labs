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
  archived:         "bg-slate/40 text-bone border-slate",
};

const STATUS_LABEL: Record<string, string> = {
  active:           "ACTIVE",
  pending_contract: "PENDING CONTRACT",
  suspended:        "SUSPENDED",
  archived:         "ARCHIVED",
};

const PROGRAM_BADGE: Record<string, string> = {
  ambassador: "bg-accent/10 text-accent border-accent/30",
  licensee:   "bg-purple-500/20 text-purple-300 border-purple-500/40",
};

type ApproveForm = { id: string; password: string; code: string; rate: string; programType: "ambassador" | "licensee" };
type SwitchConfirm = { id: string; name: string; currentProgram: "ambassador" | "licensee" };
type ArchiveConfirm = { id: string; name: string };
type ReOnboardConfirm = { id: string; name: string };
type ChangePassForm = { id: string; newPassword: string; confirm: string };

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
  const [approveForm, setApproveForm] = useState<ApproveForm | null>(null);
  const [switchConfirm, setSwitchConfirm] = useState<SwitchConfirm | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<ArchiveConfirm | null>(null);
  const [reOnboardConfirm, setReOnboardConfirm] = useState<ReOnboardConfirm | null>(null);
  const [changePassForm, setChangePassForm] = useState<ChangePassForm | null>(null);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

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
      method: "PATCH", headers: { "Content-Type": "application/json" },
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
      method: "PATCH", headers: { "Content-Type": "application/json" },
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
      showToast("Contract sent ✓");
    }
    setWorking(null);
  }

  async function handleSuspend(id: string) {
    setWorking(id);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
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
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reactivate" }),
    });
    if ((await res.json()).ok) {
      setAffiliates((prev) => prev.map((a) => a.id === id ? { ...a, status: "active" as const } : a));
    }
    setWorking(null);
  }

  async function handleSwitchProgram() {
    if (!switchConfirm) return;
    setWorking(switchConfirm.id);
    const newProgram = switchConfirm.currentProgram === "ambassador" ? "licensee" : "ambassador";
    const res = await fetch(`/api/admin/affiliates/${switchConfirm.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch-program", programType: newProgram }),
    });
    const data = await res.json();
    if (data.ok) {
      setAffiliates((prev) => prev.map((a) => a.id === switchConfirm.id ? { ...a, ...data.account } : a));
      showToast(`Switched to ${newProgram} — notification sent ✓`);
    }
    setSwitchConfirm(null);
    setWorking(null);
  }

  async function handleArchive() {
    if (!archiveConfirm) return;
    setWorking(archiveConfirm.id);
    const res = await fetch(`/api/admin/affiliates/${archiveConfirm.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if ((await res.json()).ok) {
      setAffiliates((prev) => prev.map((a) => a.id === archiveConfirm.id ? { ...a, status: "archived" as const } : a));
      showToast("Partner archived");
    }
    setArchiveConfirm(null);
    setWorking(null);
  }

  async function handleReOnboard() {
    if (!reOnboardConfirm) return;
    setWorking(reOnboardConfirm.id);
    const res = await fetch(`/api/admin/affiliates/${reOnboardConfirm.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reonboard" }),
    });
    if ((await res.json()).ok) {
      setAffiliates((prev) => prev.map((a) => a.id === reOnboardConfirm.id ? { ...a, status: "pending_contract" as const } : a));
      showToast("Contract re-sent — awaiting signature ✓");
    }
    setReOnboardConfirm(null);
    setWorking(null);
  }

  async function handleResendContract(id: string) {
    setWorking(id);
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend-contract" }),
    });
    const data = await res.json();
    if (data.ok) {
      showToast("Contract resent ✓");
    } else {
      showToast(`Failed: ${data.error ?? "unknown error"}`);
    }
    setWorking(null);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!changePassForm) return;
    setChangePassError(null);
    if (changePassForm.newPassword.length < 6) {
      setChangePassError("Password must be at least 6 characters.");
      return;
    }
    if (changePassForm.newPassword !== changePassForm.confirm) {
      setChangePassError("Passwords do not match.");
      return;
    }
    setWorking(changePassForm.id);
    const res = await fetch(`/api/admin/affiliates/${changePassForm.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-password", newPassword: changePassForm.newPassword }),
    });
    const data = await res.json();
    if (data.ok) {
      setChangePassForm(null);
      showToast("Password updated ✓");
    } else {
      setChangePassError(data.error ?? "Failed to update password.");
    }
    setWorking(null);
  }

  // ── Segment data ──────────────────────────────────────────────────────────
  const pending   = applications.filter((a) => a.status === "pending");
  const denied    = applications.filter((a) => a.status === "denied");

  const ambassadorApps = pending.filter((a) => (a.programType ?? "ambassador") === "ambassador");
  const licenseeApps   = pending.filter((a) => a.programType === "licensee");
  const ambassadors    = affiliates.filter((a) => (a.programType ?? "ambassador") === "ambassador" && a.status !== "archived");
  const licensees      = affiliates.filter((a) => a.programType === "licensee" && a.status !== "archived");
  const archived       = affiliates.filter((a) => a.status === "archived");

  const tabPending   = activeTab === "ambassadors" ? ambassadorApps : licenseeApps;
  const tabAccounts  = activeTab === "ambassadors" ? ambassadors : licensees;

  return (
    <div className="min-h-screen bg-obsidian text-paper">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-carbon border border-accent text-accent font-mono text-xs tracking-wider px-4 py-3 shadow-lg">
          {toast}
        </div>
      )}

      {/* Confirm: switch program */}
      {switchConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-obsidian/80 px-4">
          <div className="bg-carbon border border-slate p-6 max-w-sm w-full space-y-4">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em]">— CONFIRM PROGRAM SWITCH —</p>
            <p className="text-paper font-sans font-semibold">
              Switch <span className="text-accent">{switchConfirm.name}</span> from{" "}
              <span className="capitalize">{switchConfirm.currentProgram}</span> →{" "}
              <span className="capitalize">{switchConfirm.currentProgram === "ambassador" ? "Licensee" : "Ambassador"}</span>?
            </p>
            <p className="text-bone text-sm">
              Commission will update to{" "}
              <strong className="text-paper">{switchConfirm.currentProgram === "ambassador" ? "50%" : "20%"}</strong>.
              A notification email will be sent automatically.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSwitchProgram}
                disabled={working === switchConfirm.id}
                className="bg-accent text-obsidian font-semibold font-mono text-xs px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {working === switchConfirm.id ? "Switching…" : "Confirm Switch"}
              </button>
              <button onClick={() => setSwitchConfirm(null)} className="border border-slate text-bone font-mono text-xs px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: archive */}
      {archiveConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-obsidian/80 px-4">
          <div className="bg-carbon border border-slate p-6 max-w-sm w-full space-y-4">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em]">— CONFIRM ARCHIVE —</p>
            <p className="text-paper font-sans font-semibold">
              Archive <span className="text-accent">{archiveConfirm.name}</span>?
            </p>
            <p className="text-bone text-sm">
              Their data is preserved. They can be re-onboarded later, which will require them to re-sign the contract.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                disabled={working === archiveConfirm.id}
                className="bg-red-500/20 border border-red-500/40 text-red-400 font-semibold font-mono text-xs px-5 h-10 min-h-[44px] hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {working === archiveConfirm.id ? "Archiving…" : "Archive"}
              </button>
              <button onClick={() => setArchiveConfirm(null)} className="border border-slate text-bone font-mono text-xs px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: re-onboard */}
      {reOnboardConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-obsidian/80 px-4">
          <div className="bg-carbon border border-slate p-6 max-w-sm w-full space-y-4">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em]">— CONFIRM RE-ONBOARD —</p>
            <p className="text-paper font-sans font-semibold">
              Re-onboard <span className="text-accent">{reOnboardConfirm.name}</span>?
            </p>
            <p className="text-bone text-sm">
              A new contract signing link (7-day) will be emailed to them. Once signed, their account becomes active again with their existing code and password.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReOnboard}
                disabled={working === reOnboardConfirm.id}
                className="bg-accent text-obsidian font-semibold font-mono text-xs px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                {working === reOnboardConfirm.id ? "Sending…" : "Send Contract →"}
              </button>
              <button onClick={() => setReOnboardConfirm(null)} className="border border-slate text-bone font-mono text-xs px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password modal */}
      {changePassForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-obsidian/80 px-4">
          <div className="bg-carbon border border-slate p-6 max-w-sm w-full space-y-4">
            <p className="font-mono text-accent text-[10px] tracking-[0.2em]">— CHANGE PARTNER PASSWORD —</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">New Password</label>
                <input
                  type="text"
                  value={changePassForm.newPassword}
                  onChange={(e) => setChangePassForm((f) => f && { ...f, newPassword: e.target.value })}
                  placeholder="min 6 characters"
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">Confirm Password</label>
                <input
                  type="text"
                  value={changePassForm.confirm}
                  onChange={(e) => setChangePassForm((f) => f && { ...f, confirm: e.target.value })}
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent"
                />
              </div>
              {changePassError && (
                <p className="font-mono text-[10px] text-red-400">{changePassError}</p>
              )}
              <p className="font-mono text-bone/40 text-[10px]">
                This immediately updates their login password. Send them the new password separately.
              </p>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={working === changePassForm.id}
                  className="bg-accent text-obsidian font-semibold font-mono text-xs px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {working === changePassForm.id ? "Saving…" : "Save Password"}
                </button>
                <button
                  type="button"
                  onClick={() => { setChangePassForm(null); setChangePassError(null); }}
                  className="border border-slate text-bone font-mono text-xs px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <span className="text-slate">·</span>
            <Link href="/admin/system" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
        <button onClick={handleLogout} className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Sign Out</button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending Review",     value: pending.length },
            { label: "Active Ambassadors", value: ambassadors.filter((a) => a.status === "active").length },
            { label: "Active Licensees",   value: licensees.filter((a) => a.status === "active").length },
            { label: "Archived",           value: archived.length },
          ].map((s) => (
            <div key={s.label} className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">{s.label}</p>
              <p className="font-sans font-bold text-paper text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
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
                      ? tab === "ambassadors" ? "border-accent text-accent" : "border-purple-400 text-purple-300"
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

        {/* Commission info */}
        <div className={`border px-4 py-3 flex items-center gap-3 ${
          activeTab === "ambassadors" ? "border-accent/20 bg-accent/5" : "border-purple-500/20 bg-purple-500/5"
        }`}>
          <span className={`font-mono text-xs font-bold ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            {activeTab === "ambassadors" ? "20% commission" : "50% commission"}
          </span>
          <span className="text-bone/30 text-xs">·</span>
          <span className="font-mono text-bone text-xs">
            {activeTab === "ambassadors"
              ? "20% of gross product subtotal · customers get 10% off"
              : "50% of gross product subtotal · customers get 10% off · rate is locked"}
          </span>
        </div>

        {/* Pending applications */}
        <div>
          <p className={`font-mono text-xs tracking-[0.25em] mb-4 ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            — PENDING {activeTab === "ambassadors" ? "AMBASSADOR" : "LICENSEE"} APPLICATIONS ({tabPending.length}) —
          </p>
          {tabPending.length === 0 && <p className="text-bone font-mono text-sm py-4">No pending applications.</p>}
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
                    <div className="hidden sm:flex">
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
                        <span className={`${PROGRAM_BADGE[app.programType ?? "ambassador"]} px-1.5 py-0.5 border text-[10px]`}>
                          {isLicensee ? "LICENSEE · 50%" : "AMBASSADOR · 20%"}
                        </span>
                      </div>

                      {!isApproving ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setApproveForm({
                              id: app.id, password: "",
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
                                className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent uppercase"
                              />
                            </div>
                            <div>
                              <label className="block font-mono text-bone text-[10px] tracking-wider uppercase mb-2">
                                Commission % {isLicensee && <span className="text-purple-400">(locked)</span>}
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
                                  min={1} max={30}
                                  className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent"
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
                                className="w-full bg-carbon border border-slate text-paper font-mono text-sm px-3 h-10 focus:outline-none focus:border-accent"
                              />
                            </div>
                          </div>
                          <p className="font-mono text-bone/50 text-[10px]">
                            Partner receives a contract signing link at {app.email}. Credentials are emailed after signing.
                          </p>
                          <div className="flex gap-3">
                            <button type="submit" disabled={working === approveForm.id}
                              className="bg-accent text-obsidian font-semibold font-mono text-xs px-5 h-10 min-h-[44px] hover:bg-accent/80 transition-colors disabled:opacity-50">
                              {working === approveForm.id ? "Creating…" : "Send Contract →"}
                            </button>
                            <button type="button" onClick={() => setApproveForm(null)}
                              className="border border-slate text-bone font-mono text-xs px-5 h-10 min-h-[44px] hover:border-accent hover:text-accent transition-colors">
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

        {/* Accounts */}
        <div>
          <p className={`font-mono text-xs tracking-[0.25em] mb-4 ${activeTab === "ambassadors" ? "text-accent" : "text-purple-300"}`}>
            — {activeTab === "ambassadors" ? "AMBASSADOR" : "LICENSEE"} ACCOUNTS ({tabAccounts.length}) —
          </p>
          {tabAccounts.length === 0 && <p className="text-bone font-mono text-sm py-4">No {activeTab} yet.</p>}
          <div className="space-y-3">
            {tabAccounts.map((aff) => (
              <div key={aff.id} className="bg-carbon border border-slate px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_110px_130px_auto] gap-3 items-center">
                  <div>
                    <p className="font-sans font-semibold text-paper text-sm">{aff.name}</p>
                    <p className="font-mono text-bone text-xs mt-0.5">{aff.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-accent text-sm font-bold">{aff.affiliateCode}</span>
                    <button onClick={() => copyText(aff.affiliateCode)} className="font-mono text-[10px] text-bone hover:text-accent transition-colors" title="Copy">
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
                  <div className="flex flex-wrap gap-2">
                    {/* View Portal */}
                    <Link
                      href={`/admin/affiliates/${aff.id}/portal`}
                      target="_blank"
                      className="font-mono text-[10px] tracking-wider text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors"
                      title="View partner's dashboard"
                    >
                      View Portal
                    </Link>
                    {/* Change Password */}
                    <button
                      onClick={() => { setChangePassForm({ id: aff.id, newPassword: "", confirm: "" }); setChangePassError(null); }}
                      disabled={working === aff.id}
                      className="font-mono text-[10px] tracking-wider text-bone border border-slate px-3 py-1.5 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                      title="Change partner's password"
                    >
                      Password
                    </button>
                    {/* Switch program */}
                    {aff.status === "active" && (
                      <button
                        onClick={() => setSwitchConfirm({ id: aff.id, name: aff.name, currentProgram: aff.programType ?? "ambassador" })}
                        disabled={working === aff.id}
                        className="font-mono text-[10px] tracking-wider text-bone border border-slate px-3 py-1.5 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
                        title={`Switch to ${(aff.programType ?? "ambassador") === "ambassador" ? "Licensee" : "Ambassador"}`}
                      >
                        → {(aff.programType ?? "ambassador") === "ambassador" ? "Licensee" : "Ambassador"}
                      </button>
                    )}
                    {/* Resend Contract — for pending_contract accounts */}
                    {aff.status === "pending_contract" && (
                      <button
                        onClick={() => handleResendContract(aff.id)}
                        disabled={working === aff.id}
                        className="font-mono text-[10px] tracking-wider text-yellow-400 border border-yellow-500/30 px-3 py-1.5 hover:bg-yellow-500/10 transition-colors disabled:opacity-40"
                        title="Resend contract signing link"
                      >
                        {working === aff.id ? "Sending…" : "Resend Contract"}
                      </button>
                    )}
                    {/* Suspend / Reactivate */}
                    {aff.status === "active" && (
                      <button onClick={() => handleSuspend(aff.id)} disabled={working === aff.id}
                        className="font-mono text-[10px] tracking-wider text-red-400 border border-red-500/30 px-3 py-1.5 hover:bg-red-500/10 transition-colors disabled:opacity-40">
                        Suspend
                      </button>
                    )}
                    {aff.status === "suspended" && (
                      <>
                        <button onClick={() => handleReactivate(aff.id)} disabled={working === aff.id}
                          className="font-mono text-[10px] tracking-wider text-green-400 border border-green-500/30 px-3 py-1.5 hover:bg-green-500/10 transition-colors disabled:opacity-40">
                          Reactivate
                        </button>
                        <button onClick={() => setArchiveConfirm({ id: aff.id, name: aff.name })} disabled={working === aff.id}
                          className="font-mono text-[10px] tracking-wider text-bone border border-slate px-3 py-1.5 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-40">
                          Archive
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Archived partners */}
        {archived.length > 0 && (
          <div>
            <p className="font-mono text-bone text-xs tracking-[0.25em] mb-4">— ARCHIVED PARTNERS ({archived.length}) —</p>
            <div className="space-y-3">
              {archived.map((aff) => (
                <div key={aff.id} className="bg-carbon border border-slate/40 px-5 py-4 grid grid-cols-1 sm:grid-cols-[1fr_140px_130px_auto] gap-3 items-center opacity-70 hover:opacity-100 transition-opacity">
                  <div>
                    <p className="font-sans font-semibold text-bone text-sm">{aff.name}</p>
                    <p className="font-mono text-bone/50 text-xs mt-0.5">{aff.email}</p>
                    {aff.archivedAt && (
                      <p className="font-mono text-bone/40 text-[10px] mt-0.5">
                        Archived {new Date(aff.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-bone text-sm">{aff.affiliateCode}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 border tracking-wider ${PROGRAM_BADGE[aff.programType ?? "ambassador"]}`}>
                      {aff.programType === "licensee" ? "LICENSEE" : "AMBASSADOR"}
                    </span>
                  </div>
                  <div>
                    <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_COLORS.archived}`}>
                      ARCHIVED
                    </span>
                  </div>
                  <button
                    onClick={() => setReOnboardConfirm({ id: aff.id, name: aff.name })}
                    disabled={working === aff.id}
                    className="font-mono text-[10px] tracking-wider text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-40"
                  >
                    Re-onboard →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Denied */}
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

"use client";

import { useState } from "react";
import Link from "next/link";

type EnvEntry = { status: "set" | "missing"; chars: number };
type ShipStationStatus = { ok: boolean; status?: number; error?: string };

type PushResult = {
  ok: boolean;
  httpStatus?: number;
  shipStationResponse?: unknown;
  error?: string;
};

type RotationStatus = { changedAt: string | null; daysRemaining: number; isStale: boolean };

type Props = {
  envVars: Record<string, EnvEntry>;
  shipstation: ShipStationStatus;
  rotationStatus: RotationStatus;
};

export default function SystemClient({ envVars, shipstation, rotationStatus }: Props) {
  const [orderId, setOrderId] = useState("");
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushing, setPushing] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  async function pushOrder() {
    if (!orderId.trim()) return;
    setPushing(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/admin/system-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() }),
      });
      const text = await res.text();
      let data: PushResult;
      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: false, error: `Non-JSON response (HTTP ${res.status}): ${text.slice(0, 300)}` };
      }
      setPushResult(data);
    } catch (e) {
      setPushResult({ ok: false, error: String(e) });
    } finally {
      setPushing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function changePassword() {
    setPwError(null);
    setPwSuccess(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPw.length < 16) {
      setPwError("New password must be at least 16 characters.");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPwError(data.error ?? "Failed to update password.");
      } else {
        setPwSuccess(true);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        // Reload so the server-side rotation status badge refreshes
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">System</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
              Orders
            </Link>
            <span className="text-slate">·</span>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
              Partners
            </Link>
            <span className="text-slate">·</span>
            <Link href="/admin/payouts" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
              Payouts
            </Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">System</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Env Vars ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">Environment Variables</p>
          <div className="bg-carbon border border-slate divide-y divide-slate">
            {Object.entries(envVars).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <p className="font-mono text-paper text-xs tracking-wider">{key}</p>
                <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${
                  val.status === "set"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {val.status === "set" ? `SET · ${val.chars} chars` : "MISSING"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ShipStation Connection ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">ShipStation Connection</p>
          <div className={`bg-carbon border px-5 py-4 ${shipstation.ok ? "border-green-500/40" : "border-red-500/40"}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-2 h-2 rounded-full ${shipstation.ok ? "bg-green-400" : "bg-red-400"}`} />
              <p className="font-mono text-xs font-bold tracking-wider">
                {shipstation.ok ? "CONNECTED" : "FAILED"}
              </p>
            </div>
            {shipstation.ok ? (
              <p className="font-mono text-green-400 text-[10px] mt-1">
                Credentials valid — API responding normally.
              </p>
            ) : (
              <div className="mt-2 space-y-1">
                {shipstation.status && (
                  <p className="font-mono text-red-400 text-xs">HTTP {shipstation.status}</p>
                )}
                {shipstation.error && (
                  <pre className="font-mono text-bone text-[10px] bg-obsidian border border-slate p-3 overflow-x-auto whitespace-pre-wrap">
                    {shipstation.error}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Password Rotation ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">Password Rotation</p>
          <div className={`bg-carbon border p-5 space-y-4 ${rotationStatus.isStale ? "border-red-500/50" : rotationStatus.daysRemaining <= 14 ? "border-amber-500/40" : "border-slate"}`}>

            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${rotationStatus.isStale ? "bg-red-400" : rotationStatus.daysRemaining <= 14 ? "bg-amber-400" : "bg-green-400"}`} />
              <p className="font-mono text-xs font-bold tracking-wider">
                {rotationStatus.isStale
                  ? "OVERDUE — Password must be rotated to access banking data"
                  : rotationStatus.changedAt === null
                  ? "NOT YET INITIALIZED — Log in once to start the 90-day clock"
                  : `${rotationStatus.daysRemaining} days remaining`}
              </p>
            </div>

            {rotationStatus.changedAt && (
              <p className="font-mono text-bone/60 text-[10px]">
                Last rotated: {new Date(rotationStatus.changedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}

            <p className="font-mono text-bone text-xs">
              Admin password must be changed every 90 days. When overdue, access to partner banking data is blocked until rotation is complete.
            </p>

            {/* Change password form */}
            {pwSuccess ? (
              <div className="border border-green-500/40 bg-green-500/5 p-4">
                <p className="font-mono text-green-400 text-xs font-bold tracking-wider">Password updated — rotation clock reset.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-bone/40"
                  autoComplete="current-password"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (16+ characters)"
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-bone/40"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-bone/40"
                  autoComplete="new-password"
                />
                {pwError && (
                  <p className="font-mono text-red-400 text-xs">{pwError}</p>
                )}
                <button
                  onClick={changePassword}
                  disabled={changingPw || !currentPw || !newPw || !confirmPw}
                  className="w-full bg-accent text-obsidian font-mono text-xs font-bold py-2.5 hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {changingPw ? "Updating…" : "Update Password"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Manual ShipStation Push ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">Push Order to ShipStation</p>
          <div className="bg-carbon border border-slate p-5 space-y-4">
            <p className="font-mono text-bone text-xs">
              Enter a paid order ID to manually push it to ShipStation. Use this to retry failed pushes or sync a specific order.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID (e.g. m9k3x2abc)"
                className="flex-1 bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-bone/40"
              />
              <button
                onClick={pushOrder}
                disabled={pushing || !orderId.trim()}
                className="bg-accent text-obsidian font-mono text-xs font-bold px-5 py-2.5 hover:bg-accent/80 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {pushing ? "Pushing…" : "Push to ShipStation"}
              </button>
            </div>

            {pushResult && (
              <div className={`border p-4 ${pushResult.ok ? "border-green-500/40 bg-green-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                <p className={`font-mono text-xs font-bold tracking-wider mb-2 ${pushResult.ok ? "text-green-400" : "text-red-400"}`}>
                  {pushResult.ok ? "SUCCESS — Order pushed to ShipStation" : `FAILED — HTTP ${pushResult.httpStatus ?? "error"}`}
                </p>
                <pre className="font-mono text-bone text-[10px] bg-obsidian border border-slate p-3 overflow-x-auto whitespace-pre-wrap max-h-64">
                  {JSON.stringify(pushResult.shipStationResponse ?? pushResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

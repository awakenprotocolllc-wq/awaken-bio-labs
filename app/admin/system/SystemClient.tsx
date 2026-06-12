"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type EnvEntry = { status: "set" | "missing"; chars: number };
type CheckResult = {
  ok: boolean;
  envVars?: Record<string, EnvEntry>;
  shipstation?: { ok: boolean; status?: number; error?: string };
  error?: string;
};

type PushResult = {
  ok: boolean;
  httpStatus?: number;
  shipStationResponse?: unknown;
  error?: string;
};

export default function SystemClient() {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushing, setPushing] = useState(false);

  async function runCheck() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/system-check");
      const text = await res.text();
      let data: CheckResult;
      try {
        data = JSON.parse(text);
      } catch {
        setLoadError(`API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
        return;
      }
      setCheck(data);
    } catch (e) {
      setLoadError(String(e));
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => { runCheck(); }, []);

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
              Affiliates
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
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">Environment Variables</p>
            <button
              onClick={runCheck}
              disabled={loading}
              className="font-mono text-xs text-accent border border-accent/40 px-3 py-1 hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>

          {loading && !check && (
            <p className="font-mono text-bone text-xs">Running checks…</p>
          )}

          {loadError && (
            <div className="bg-red-500/10 border border-red-500/40 p-4">
              <p className="font-mono text-red-400 text-xs font-bold mb-2">ERROR LOADING SYSTEM CHECK</p>
              <pre className="font-mono text-bone text-[10px] whitespace-pre-wrap">{loadError}</pre>
            </div>
          )}

          {check && check.envVars && (
            <div className="bg-carbon border border-slate divide-y divide-slate">
              {Object.entries(check.envVars).map(([key, val]) => (
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
          )}
        </div>

        {/* ── ShipStation Connection ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">ShipStation Connection</p>
          {check && check.shipstation && (
            <div className={`bg-carbon border px-5 py-4 ${check.shipstation.ok ? "border-green-500/40" : "border-red-500/40"}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-2 h-2 rounded-full ${check.shipstation.ok ? "bg-green-400" : "bg-red-400"}`} />
                <p className="font-mono text-xs font-bold tracking-wider">
                  {check.shipstation.ok ? "CONNECTED" : "FAILED"}
                </p>
              </div>
              {!check.shipstation.ok && (
                <div className="mt-2">
                  {check.shipstation.status && (
                    <p className="font-mono text-red-400 text-xs">HTTP {check.shipstation.status}</p>
                  )}
                  {check.shipstation.error && (
                    <pre className="font-mono text-bone text-[10px] mt-2 bg-obsidian border border-slate p-3 overflow-x-auto whitespace-pre-wrap">
                      {check.shipstation.error}
                    </pre>
                  )}
                </div>
              )}
              {check.shipstation.ok && (
                <p className="font-mono text-green-400 text-[10px] mt-1">
                  Credentials valid — API responding normally.
                </p>
              )}
            </div>
          )}
          {check && !check.shipstation && (
            <p className="font-mono text-bone text-xs">No ShipStation data returned.</p>
          )}
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

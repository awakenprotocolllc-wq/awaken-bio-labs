"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

type OrderDetail = {
  id: string;
  createdAt: string;
  status: string;
  subtotal: string;
  commission: string;
  items: { product: string; strength: string; qty: number; price: string }[];
};

type PayoutRecord = {
  affiliateId: string;
  month: string;
  amount: number;
  confirmationCode: string;
  paidAt: string;
  note?: string;
};

type AffiliateSummary = {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  programType: "ambassador" | "licensee";
  commissionRate: number;
  status: string;
  confirmedEarnings: number;
  pendingEarnings: number;
  orderCount: number;
  orders: OrderDetail[];
  payoutRecords: Record<string, PayoutRecord>;
};

type PayoutsData = {
  totalConfirmed: number;
  totalPending: number;
  totalPaid: number;
  ambassadorCount: number;
  licenseeCount: number;
  affiliates: AffiliateSummary[];
  fetchedAt: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  fulfilled:       "text-green-400",
  paid:            "text-yellow-400",
  pending_payment: "text-bone/50",
  cancelled:       "text-red-400/50",
};
const STATUS_LABEL: Record<string, string> = {
  fulfilled: "Fulfilled", paid: "Paid", pending_payment: "Pending", cancelled: "Cancelled",
};

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
// Payouts for earnings month X are due the 15th of the following month
function payoutDueDate(earningsMonth: string) {
  const [y, m] = earningsMonth.split("-").map(Number);
  const due = m === 12 ? new Date(y + 1, 0, 15) : new Date(y, m, 15);
  return due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
function isPayoutDue(earningsMonth: string) {
  const [y, m] = earningsMonth.split("-").map(Number);
  const dueDate = m === 12 ? new Date(y + 1, 0, 15) : new Date(y, m, 15);
  return new Date() >= dueDate;
}

function groupByMonth(orders: OrderDetail[]) {
  const map = new Map<string, { confirmed: number; pending: number; orders: OrderDetail[] }>();
  for (const o of orders) {
    const key = monthKey(o.createdAt);
    const entry = map.get(key) ?? { confirmed: 0, pending: 0, orders: [] };
    const c = parseFloat(o.commission.replace(/[^0-9.]/g, "")) || 0;
    if (o.status === "fulfilled") entry.confirmed += c;
    else entry.pending += c;
    entry.orders.push(o);
    map.set(key, entry);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

// Build a cross-affiliate monthly view from summaries
function buildMonthlyView(affiliates: AffiliateSummary[]) {
  const map = new Map<string, {
    confirmed: number;
    paid: number;
    rows: { aff: AffiliateSummary; earned: number; record: PayoutRecord | undefined }[];
  }>();

  for (const aff of affiliates) {
    const months = groupByMonth(aff.orders);
    for (const [key, entry] of months) {
      if (entry.confirmed === 0 && entry.pending === 0) continue;
      const bucket = map.get(key) ?? { confirmed: 0, paid: 0, rows: [] };
      const record = aff.payoutRecords?.[key];
      bucket.confirmed += entry.confirmed;
      if (record) bucket.paid += record.amount;
      bucket.rows.push({ aff, earned: entry.confirmed, record });
      map.set(key, bucket);
    }
  }

  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

// ── Record Payment Form ───────────────────────────────────────────────────────

function RecordPaymentForm({
  affiliateId, month, defaultAmount, onSave,
}: {
  affiliateId: string;
  month: string;
  defaultAmount: number;
  onSave: (record: PayoutRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(defaultAmount.toFixed(2));
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setErr("Confirmation code is required."); return; }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setErr("Enter a valid amount."); return; }
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, month, amount: parsed, confirmationCode: code, note }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      onSave(data.record);
      setOpen(false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-[10px] text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors tracking-wider"
      >
        + Record Payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="border border-accent/30 bg-accent/5 p-4 space-y-3">
      <p className="font-mono text-[10px] text-accent tracking-[0.15em] uppercase">Record Payout — {monthLabel(month)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-mono text-[10px] text-bone/50 uppercase tracking-wider mb-1">Amount Paid *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-bone/50 text-xs">$</span>
            <input
              type="number" step="0.01" min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-obsidian border border-slate text-paper font-mono text-xs pl-6 pr-3 py-2 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-[10px] text-bone/50 uppercase tracking-wider mb-1">Confirmation Code *</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ACH trace / wire ref / check #"
            className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2 focus:outline-none focus:border-accent placeholder:text-bone/30"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-bone/50 uppercase tracking-wider mb-1">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bank, method, etc."
            className="w-full bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2 focus:outline-none focus:border-accent placeholder:text-bone/30"
          />
        </div>
      </div>
      {err && <p className="font-mono text-[10px] text-red-400">{err}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit" disabled={saving}
          className="bg-accent text-obsidian font-mono text-[10px] font-bold px-4 py-2 hover:bg-accent/80 transition-colors disabled:opacity-50 tracking-wider"
        >
          {saving ? "Saving…" : "Confirm Payment"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="font-mono text-[10px] text-bone/50 hover:text-bone">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Payout Status Badge ───────────────────────────────────────────────────────

function PayoutStatus({ record, affiliateId, month, earned, onSave }: {
  record: PayoutRecord | undefined;
  affiliateId: string;
  month: string;
  earned: number;
  onSave: (record: PayoutRecord) => void;
}) {
  const due = isPayoutDue(month);

  if (record) {
    return (
      <div className="flex flex-wrap items-center gap-4 border border-green-500/30 bg-green-500/5 px-4 py-3">
        <span className="font-mono text-[10px] font-bold text-green-400 tracking-wider">✓ PAID</span>
        <div>
          <p className="font-mono text-[10px] text-bone/40">Amount</p>
          <p className="font-mono text-sm text-green-400 font-bold">{fmt(record.amount)}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-bone/40">Confirmation</p>
          <p className="font-mono text-xs text-accent">{record.confirmationCode}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-bone/40">Paid On</p>
          <p className="font-mono text-xs text-paper">{fmtDate(record.paidAt)}</p>
        </div>
        {record.note && (
          <div>
            <p className="font-mono text-[10px] text-bone/40">Note</p>
            <p className="font-mono text-xs text-bone/70">{record.note}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
      due ? "border-yellow-500/30 bg-yellow-500/5" : "border-slate bg-carbon"
    }`}>
      <div>
        <p className={`font-mono text-[10px] font-bold tracking-wider ${due ? "text-yellow-400" : "text-bone/40"}`}>
          {due ? "⚠ UNPAID" : "NOT YET DUE"}
        </p>
        <p className="font-mono text-[10px] text-bone/40 mt-0.5">
          Payout due: {payoutDueDate(month)}
        </p>
      </div>
      {earned > 0 && (
        <RecordPaymentForm
          affiliateId={affiliateId}
          month={month}
          defaultAmount={earned}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ── Affiliate Row (Partners view) ─────────────────────────────────────────────

function AffiliateRow({
  aff, onRecordSave,
}: {
  aff: AffiliateSummary;
  onRecordSave: (affiliateId: string, month: string, record: PayoutRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const months = groupByMonth(aff.orders);
  const [openMonth, setOpenMonth] = useState<string | null>(months[0]?.[0] ?? null);

  return (
    <div className="border border-slate bg-carbon">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-obsidian/40 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-paper text-sm">{aff.name}</p>
          <p className="font-mono text-[10px] text-bone/50 mt-0.5 truncate">{aff.email}</p>
        </div>
        <div className="hidden sm:block w-28 shrink-0">
          <p className="font-mono text-accent text-xs">{aff.affiliateCode}</p>
          <p className="font-mono text-[10px] text-bone/40">{Math.round(aff.commissionRate * 100)}% commission</p>
        </div>
        <div className="w-28 shrink-0 text-right">
          <p className={`font-mono text-sm font-bold ${aff.confirmedEarnings > 0 ? "text-green-400" : "text-bone/30"}`}>
            {fmt(aff.confirmedEarnings)}
          </p>
          <p className="font-mono text-[10px] text-bone/40">confirmed</p>
        </div>
        <div className="w-24 shrink-0 text-right">
          <p className={`font-mono text-sm ${aff.pendingEarnings > 0 ? "text-yellow-400" : "text-bone/30"}`}>
            {fmt(aff.pendingEarnings)}
          </p>
          <p className="font-mono text-[10px] text-bone/40">pending</p>
        </div>
        <div className="hidden md:block w-16 shrink-0 text-right">
          <p className="font-mono text-paper text-sm">{aff.orderCount}</p>
          <p className="font-mono text-[10px] text-bone/40">orders</p>
        </div>
        <span className={`font-mono text-bone/40 text-xs ml-2 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {expanded && (
        <div className="border-t border-slate bg-obsidian/60 px-5 py-5 space-y-5">
          {aff.orders.length === 0 ? (
            <p className="font-mono text-bone/40 text-xs">No orders attributed to this affiliate yet.</p>
          ) : (
            <>
              {/* Month tabs */}
              <div className="flex flex-wrap gap-2">
                {months.map(([key]) => (
                  <button
                    key={key}
                    onClick={() => setOpenMonth(key)}
                    className={`font-mono text-[10px] px-3 py-1.5 border tracking-wider transition-colors ${
                      openMonth === key
                        ? "bg-accent/10 text-accent border-accent/40"
                        : "text-bone border-slate hover:border-accent/30 hover:text-accent"
                    }`}
                  >
                    {monthLabel(key)}
                    {aff.payoutRecords?.[key] && <span className="ml-1.5 text-green-400">✓</span>}
                  </button>
                ))}
              </div>

              {openMonth && (() => {
                const entry = months.find(([k]) => k === openMonth)?.[1];
                if (!entry) return null;
                const record = aff.payoutRecords?.[openMonth];

                return (
                  <div className="space-y-4">
                    {/* Monthly earnings strip */}
                    <div className="flex flex-wrap gap-6 border border-slate/50 bg-carbon px-4 py-3">
                      <div>
                        <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Month</p>
                        <p className="font-mono text-paper text-sm">{monthLabel(openMonth)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Confirmed Earned</p>
                        <p className="font-mono text-green-400 text-sm font-bold">{fmt(entry.confirmed)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Pending</p>
                        <p className="font-mono text-yellow-400 text-sm">{fmt(entry.pending)}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-bone/50 uppercase tracking-wider">Orders</p>
                        <p className="font-mono text-paper text-sm">{entry.orders.length}</p>
                      </div>
                    </div>

                    {/* Payout status */}
                    <PayoutStatus
                      record={record}
                      affiliateId={aff.id}
                      month={openMonth}
                      earned={entry.confirmed}
                      onSave={(r) => onRecordSave(aff.id, openMonth, r)}
                    />

                    {/* Order list */}
                    <div className="space-y-2">
                      {entry.orders.map((o) => (
                        <div key={o.id} className="border border-slate/50 bg-carbon px-4 py-3 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-mono text-[10px] text-bone/50">{fmtDate(o.createdAt)} · {fmtTime(o.createdAt)}</p>
                              <p className="font-mono text-paper text-xs mt-0.5">#{o.id}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`font-mono text-[10px] tracking-wider ${STATUS_COLORS[o.status] ?? "text-bone"}`}>
                                {STATUS_LABEL[o.status] ?? o.status}
                              </p>
                              <p className="font-mono text-bone/60 text-xs">Subtotal {o.subtotal}</p>
                              <p className="font-mono text-accent text-sm font-bold">{o.commission}</p>
                            </div>
                          </div>
                          <div className="divide-y divide-slate/30">
                            {o.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5">
                                <p className="font-sans text-xs text-paper">
                                  {item.product}<span className="text-bone/50 ml-1">· {item.strength}</span>
                                </p>
                                <p className="font-mono text-xs text-bone/70 shrink-0 ml-4">
                                  {item.qty > 1 ? `${item.qty} × ` : ""}{item.price}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Monthly View (financial statement style) ──────────────────────────────────

function MonthlyView({
  data, onRecordSave,
}: {
  data: PayoutsData;
  onRecordSave: (affiliateId: string, month: string, record: PayoutRecord) => void;
}) {
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const months = buildMonthlyView(data.affiliates);

  function toggle(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  if (months.length === 0) {
    return <p className="font-mono text-bone/40 text-xs text-center py-16">No earnings data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {months.map(([key, bucket]) => {
        const outstanding = bucket.confirmed - bucket.paid;
        const fullyPaid = outstanding <= 0.005;
        const isOpen = openMonths.has(key);

        return (
          <div key={key} className="border border-slate bg-carbon">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-obsidian/40 transition-colors"
            >
              <div className="flex-1">
                <p className="font-sans font-semibold text-paper">{monthLabel(key)}</p>
                <p className="font-mono text-[10px] text-bone/40 mt-0.5">
                  Payout due: {payoutDueDate(key)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] text-bone/40">Earned</p>
                <p className="font-mono text-paper text-sm">{fmt(bucket.confirmed)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] text-bone/40">Paid Out</p>
                <p className="font-mono text-green-400 text-sm font-bold">{fmt(bucket.paid)}</p>
              </div>
              <div className="text-right shrink-0 w-24">
                <p className="font-mono text-[10px] text-bone/40">Outstanding</p>
                <p className={`font-mono text-sm font-bold ${fullyPaid ? "text-bone/30" : "text-yellow-400"}`}>
                  {fullyPaid ? "—" : fmt(outstanding)}
                </p>
              </div>
              <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider shrink-0 ${
                fullyPaid
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : isPayoutDue(key)
                  ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                  : "text-bone/40 border-slate"
              }`}>
                {fullyPaid ? "PAID" : isPayoutDue(key) ? "DUE" : "UPCOMING"}
              </span>
              <span className={`font-mono text-bone/40 text-xs ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </button>

            {isOpen && (
              <div className="border-t border-slate bg-obsidian/60 px-5 py-5 space-y-2">
                {/* Column headers */}
                <div className="flex items-center gap-4 px-4 pb-1">
                  <p className="flex-1 font-mono text-[10px] text-bone/40 uppercase tracking-wider">Partner</p>
                  <p className="w-20 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Earned</p>
                  <p className="w-32 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Status</p>
                </div>

                {bucket.rows
                  .sort((a, b) => b.earned - a.earned)
                  .map(({ aff, earned, record }) => (
                    <div key={aff.id} className="border border-slate/50 bg-carbon px-4 py-3 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-paper font-semibold">{aff.name}</p>
                          <p className="font-mono text-[10px] text-bone/40">
                            {aff.affiliateCode} · {aff.programType} · {Math.round(aff.commissionRate * 100)}%
                          </p>
                        </div>
                        <p className="w-20 text-right font-mono text-sm text-green-400 font-bold shrink-0">{fmt(earned)}</p>
                        <div className="w-32 text-right shrink-0">
                          {record ? (
                            <span className="font-mono text-[10px] text-green-400 tracking-wider">✓ PAID</span>
                          ) : earned > 0 ? (
                            <span className={`font-mono text-[10px] tracking-wider ${isPayoutDue(key) ? "text-yellow-400" : "text-bone/40"}`}>
                              {isPayoutDue(key) ? "⚠ UNPAID" : "NOT YET DUE"}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-bone/30">—</span>
                          )}
                        </div>
                      </div>

                      {record ? (
                        <div className="flex flex-wrap gap-4 border-t border-slate/40 pt-2">
                          <div>
                            <p className="font-mono text-[10px] text-bone/40">Confirmation</p>
                            <p className="font-mono text-xs text-accent">{record.confirmationCode}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[10px] text-bone/40">Paid</p>
                            <p className="font-mono text-xs text-paper">{fmt(record.amount)} on {fmtDate(record.paidAt)}</p>
                          </div>
                          {record.note && (
                            <div>
                              <p className="font-mono text-[10px] text-bone/40">Note</p>
                              <p className="font-mono text-xs text-bone/60">{record.note}</p>
                            </div>
                          )}
                        </div>
                      ) : earned > 0 && (
                        <div className="border-t border-slate/40 pt-2">
                          <RecordPaymentForm
                            affiliateId={aff.id}
                            month={key}
                            defaultAmount={earned}
                            onSave={(r) => onRecordSave(aff.id, key, r)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Partner Section (Partners view) ──────────────────────────────────────────

function PartnerSection({
  title, affiliates, onRecordSave,
}: {
  title: string;
  affiliates: AffiliateSummary[];
  onRecordSave: (affiliateId: string, month: string, record: PayoutRecord) => void;
}) {
  if (affiliates.length === 0) return null;
  const totalConfirmed = affiliates.reduce((s, a) => s + a.confirmedEarnings, 0);
  const totalPaid = affiliates.reduce(
    (s, a) => s + Object.values(a.payoutRecords ?? {}).reduce((r, p) => r + p.amount, 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">{title} · {affiliates.length}</p>
        <div className="flex items-center gap-4">
          <p className="font-mono text-[10px] text-bone/50">Paid: <span className="text-green-400">{fmt(totalPaid)}</span></p>
          <p className="font-mono text-[10px] text-bone/50">Owed: <span className="text-accent font-bold">{fmt(totalConfirmed)}</span></p>
        </div>
      </div>
      <div className="flex items-center gap-4 px-5 py-2">
        <p className="flex-1 font-mono text-[10px] text-bone/40 uppercase tracking-wider">Partner</p>
        <p className="hidden sm:block w-28 font-mono text-[10px] text-bone/40 uppercase tracking-wider">Code</p>
        <p className="w-28 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Confirmed</p>
        <p className="w-24 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Pending</p>
        <p className="hidden md:block w-16 text-right font-mono text-[10px] text-bone/40 uppercase tracking-wider">Orders</p>
        <span className="w-6" />
      </div>
      <div className="space-y-1">
        {affiliates
          .sort((a, b) => b.confirmedEarnings - a.confirmedEarnings)
          .map((aff) => (
            <AffiliateRow key={aff.id} aff={aff} onRecordSave={onRecordSave} />
          ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PayoutsClient() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"partners" | "monthly">("partners");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/admin/payouts");
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, [load]);

  // Optimistic update: inject a new payout record into local state
  function handleRecordSave(affiliateId: string, month: string, record: PayoutRecord) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalPaid: prev.totalPaid + record.amount,
        affiliates: prev.affiliates.map((a) =>
          a.id === affiliateId
            ? { ...a, payoutRecords: { ...a.payoutRecords, [month]: record } }
            : a
        ),
      };
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const ambassadors = data?.affiliates.filter((a) => a.programType === "ambassador") ?? [];
  const licensees   = data?.affiliates.filter((a) => a.programType === "licensee") ?? [];

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Payouts</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/products" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Products</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">Payouts</span>
            <span className="text-slate">·</span>
            <Link href="/admin/customers" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Customers</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/system" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
        <button onClick={handleLogout} className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">
          Sign Out
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Owed",    value: data ? fmt(data.totalConfirmed) : "—", color: "text-accent",     sub: "confirmed earnings" },
            { label: "Total Paid",    value: data ? fmt(data.totalPaid)      : "—", color: "text-green-400",  sub: "disbursed to date" },
            { label: "Ambassadors",   value: data ? String(data.ambassadorCount) : "—", color: "text-paper", sub: "active partners" },
            { label: "Licensees",     value: data ? String(data.licenseeCount)   : "—", color: "text-paper", sub: "active partners" },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-carbon border border-slate px-5 py-4">
              <p className="font-mono text-[10px] text-bone/50 tracking-[0.15em] uppercase mb-1">{label}</p>
              <p className={`font-sans font-bold text-2xl ${color}`}>{value}</p>
              <p className="font-mono text-[10px] text-bone/40 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* View toggle + refresh */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center border border-slate">
            {(["partners", "monthly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`font-mono text-[10px] px-4 py-2 tracking-wider transition-colors capitalize ${
                  view === v ? "bg-accent text-obsidian font-bold" : "text-bone hover:text-accent"
                }`}
              >
                {v === "partners" ? "By Partner" : "By Month"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[10px] text-bone/40">
              {data ? `Updated ${new Date(data.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · auto-refreshes every 2 min` : ""}
            </p>
            <button
              onClick={load} disabled={loading}
              className="font-mono text-[10px] text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors disabled:opacity-40 tracking-wider"
            >
              {loading ? "…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/5 px-4 py-3">
            <p className="font-mono text-red-400 text-xs">{error}</p>
          </div>
        )}

        {loading && !data && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="bg-carbon border border-slate h-14 animate-pulse" />)}
          </div>
        )}

        {data && view === "partners" && (
          <div className="space-y-10">
            <PartnerSection title="Ambassadors" affiliates={ambassadors} onRecordSave={handleRecordSave} />
            <PartnerSection title="Licensees"   affiliates={licensees}   onRecordSave={handleRecordSave} />
            {data.affiliates.length === 0 && (
              <p className="font-mono text-bone/40 text-xs text-center py-16">No active partners yet.</p>
            )}
          </div>
        )}

        {data && view === "monthly" && (
          <MonthlyView data={data} onRecordSave={handleRecordSave} />
        )}
      </div>
    </div>
  );
}

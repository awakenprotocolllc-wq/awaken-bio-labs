"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type Order, type OrderStatus } from "@/lib/db";
import { getUnitCost, calcOrderCogs, fmtDollars } from "@/lib/cogs";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid:            "Paid",
  fulfilled:       "Fulfilled",
  cancelled:       "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  paid:            "bg-blue-500/20 text-blue-400 border-blue-500/40",
  fulfilled:       "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled:       "bg-red-500/20 text-red-400 border-red-500/40",
};

// Border highlight for selected filter card
const STATUS_SELECTED_BORDER: Record<OrderStatus, string> = {
  pending_payment: "border-yellow-400",
  paid:            "border-blue-400",
  fulfilled:       "border-green-400",
  cancelled:       "border-red-400",
};

function parseAmount(s?: string): number {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function marginColor(pct: number): string {
  if (pct >= 60) return "text-green-400";
  if (pct >= 40) return "text-yellow-400";
  return "text-red-400";
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

function currentMonthKey() {
  return monthKey(new Date().toISOString());
}

// ── Single order row (shared between list and month views) ───────────────────

function OrderRow({
  order, expandedId, setExpandedId, updating, updateStatus,
}: {
  order: Order;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  updating: string | null;
  updateStatus: (id: string, status: OrderStatus) => void;
}) {
  const isExpanded = expandedId === order.id;
  const orderCogs    = calcOrderCogs(order.items);
  const orderRevenue = parseAmount(order.orderTotal ?? order.subtotal);
  const orderProfit  = orderRevenue - orderCogs;
  const orderMargin  = orderRevenue > 0 ? Math.round((orderProfit / orderRevenue) * 100) : 0;
  const isFulfilled  = order.status === "fulfilled";

  return (
    <div className="bg-carbon border border-slate">
      <div
        className="grid grid-cols-[1fr_auto] sm:grid-cols-[160px_1fr_120px_130px_140px] gap-3 items-center px-4 sm:px-5 py-4 cursor-pointer hover:bg-slate/20 transition-colors"
        onClick={() => setExpandedId(isExpanded ? null : order.id)}
      >
        <div className="font-mono text-accent text-xs tracking-wider">
          #{order.id.toUpperCase()}
          <span className="block text-bone text-[10px] mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </span>
        </div>

        <div className="hidden sm:block">
          <p className="font-sans font-semibold text-paper text-sm">{order.customer.name}</p>
          <p className="font-mono text-bone text-xs mt-0.5">{order.customer.email}</p>
        </div>

        <div className="hidden sm:block">
          <p className="font-mono text-accent text-sm font-bold">
            {order.orderTotal ?? order.subtotal}
          </p>
          {isFulfilled && orderCogs > 0 && (
            <p className={`font-mono text-[10px] mt-0.5 ${marginColor(orderMargin)}`}>
              {orderMargin}% margin
            </p>
          )}
        </div>

        <div className="hidden sm:block">
          <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
          <select
            value={order.status}
            disabled={updating === order.id}
            onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
            className="bg-obsidian border border-slate text-paper font-mono text-xs px-2 py-1.5 focus:outline-none focus:border-accent disabled:opacity-50 w-full"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Mobile summary */}
        <div className="sm:hidden text-right">
          <p className="font-mono text-accent text-sm font-bold">
            {order.orderTotal ?? order.subtotal}
          </p>
          <span className={`inline-block font-mono text-[9px] px-2 py-0.5 border mt-1 tracking-wider ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate px-4 sm:px-5 py-5 space-y-5">
          {/* Mobile status update */}
          <div className="sm:hidden" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-2">Update Status</p>
            <select
              value={order.status}
              disabled={updating === order.id}
              onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
              className="bg-obsidian border border-slate text-paper font-mono text-xs px-3 py-2 focus:outline-none focus:border-accent disabled:opacity-50 w-full"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">CUSTOMER</p>
              <p className="text-paper font-semibold text-sm">{order.customer.name}</p>
              <p className="text-bone text-sm">{order.customer.email}</p>
            </div>
            <div>
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">SHIP TO</p>
              <p className="text-paper text-sm leading-relaxed">
                {order.shipping.line1}<br />
                {order.shipping.city}, {order.shipping.state} {order.shipping.zip}
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">ITEMS</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate">
                  <th className="text-left font-mono text-bone text-[10px] tracking-wider uppercase pb-2 pr-4">Product</th>
                  <th className="text-center font-mono text-bone text-[10px] tracking-wider uppercase pb-2 px-2">Strength</th>
                  <th className="text-center font-mono text-bone text-[10px] tracking-wider uppercase pb-2 px-2">Qty</th>
                  <th className="text-right font-mono text-bone text-[10px] tracking-wider uppercase pb-2 px-2">Price</th>
                  <th className="text-right font-mono text-bone text-[10px] tracking-wider uppercase pb-2">COGS</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => {
                  const unitCost = getUnitCost(item.product, item.strength);
                  const lineCogs = unitCost * item.qty;
                  return (
                    <tr key={i} className="border-b border-slate/50">
                      <td className="py-2.5 pr-4 text-paper">{item.product}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-accent text-xs">{item.strength}</td>
                      <td className="py-2.5 px-2 text-center text-bone">{item.qty}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-accent text-xs font-bold">{item.price}</td>
                      <td className="py-2.5 text-right font-mono text-bone text-xs">
                        {unitCost > 0 ? fmtDollars(lineCogs) : <span className="text-slate">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-slate">
                <tr>
                  <td colSpan={3} className="pt-3 font-mono text-bone text-xs tracking-wider uppercase">Subtotal</td>
                  <td className="pt-3 text-right font-mono text-accent text-sm font-bold px-2">{order.subtotal}</td>
                  <td className="pt-3 text-right font-mono text-bone text-xs">
                    {orderCogs > 0 ? fmtDollars(orderCogs) : <span className="text-slate">—</span>}
                  </td>
                </tr>
                {order.discountAmount && (
                  <tr>
                    <td colSpan={4} className="pt-1 font-mono text-bone text-xs tracking-wider uppercase">
                      Discount {order.discountCode && <span className="text-accent">({order.discountCode})</span>}
                    </td>
                    <td className="pt-1 text-right font-mono text-red-400 text-xs">−{order.discountAmount}</td>
                  </tr>
                )}
                {order.shippingCost && (
                  <tr>
                    <td colSpan={4} className="pt-1 font-mono text-bone text-xs tracking-wider uppercase">Shipping</td>
                    <td className="pt-1 text-right font-mono text-bone text-xs">{order.shippingCost}</td>
                  </tr>
                )}
                {order.orderTotal && (
                  <tr>
                    <td colSpan={4} className="pt-2 font-mono text-bone text-xs tracking-wider uppercase font-bold">Order Total</td>
                    <td className="pt-2 text-right font-mono text-accent text-sm font-bold">{order.orderTotal}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {isFulfilled && (
            <div className="bg-obsidian border border-slate p-4">
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-4">FINANCIALS (FULFILLED)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Revenue</p>
                  <p className="font-sans font-bold text-accent text-lg">{fmtDollars(orderRevenue)}</p>
                </div>
                <div>
                  <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">COGS</p>
                  <p className="font-sans font-bold text-red-400 text-lg">
                    {orderCogs > 0 ? fmtDollars(orderCogs) : <span className="text-slate text-sm">not set</span>}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Gross Profit</p>
                  <p className={`font-sans font-bold text-lg ${orderCogs > 0 ? (orderProfit >= 0 ? "text-green-400" : "text-red-400") : "text-slate"}`}>
                    {orderCogs > 0 ? fmtDollars(orderProfit) : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Margin</p>
                  <p className={`font-sans font-bold text-lg ${orderCogs > 0 ? marginColor(orderMargin) : "text-slate"}`}>
                    {orderCogs > 0 ? `${orderMargin}%` : "—"}
                  </p>
                </div>
              </div>
              {order.refCode && (
                <p className="font-mono text-bone text-[10px] mt-3 pt-3 border-t border-slate tracking-wider">
                  AFFILIATE: <span className="text-accent">{order.refCode}</span>
                  {" · "}Commission: <span className="text-accent">{fmtDollars(parseAmount(order.subtotal) * 0.20)}</span>
                  {" "}<span className="text-bone/50">(20% of subtotal)</span>
                </p>
              )}
            </div>
          )}

          {!isFulfilled && (
            <div className="bg-obsidian border border-slate/40 px-4 py-3">
              <p className="font-mono text-bone text-[10px] tracking-wider">
                FINANCIALS — COGS counted only when order is marked{" "}
                <span className="text-green-400">Fulfilled</span>
              </p>
            </div>
          )}

          {order.notes && (
            <div>
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-2">NOTES</p>
              <p className="text-bone text-sm leading-relaxed bg-obsidian border border-slate px-4 py-3">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders]           = useState(initialOrders);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [viewMode, setViewMode]       = useState<"list" | "month">("list");

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? data.order : o)));
    }
    setUpdating(null);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  // ── Counts (always from all orders) ─────────────────────────────────────
  const statusCounts = useMemo(
    () => orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; }, {} as Record<string, number>),
    [orders]
  );

  // ── Financials (fulfilled orders only, always unfiltered) ────────────────
  const fulfilledOrders  = orders.filter((o) => o.status === "fulfilled");
  const fulfilledRevenue = fulfilledOrders.reduce((s, o) => s + parseAmount(o.orderTotal ?? o.subtotal), 0);
  const totalCogs        = fulfilledOrders.reduce((s, o) => s + calcOrderCogs(o.items), 0);
  const grossProfit      = fulfilledRevenue - totalCogs;
  const marginPct        = fulfilledRevenue > 0 ? Math.round((grossProfit / fulfilledRevenue) * 100) : 0;

  // ── Filtered orders ──────────────────────────────────────────────────────
  const filtered = useMemo(
    () => statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  // ── Month grouping ───────────────────────────────────────────────────────
  const monthGroups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filtered) {
      const key = monthKey(o.createdAt);
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Month sections open state — current month open by default
  const [openMonths, setOpenMonths] = useState<Set<string>>(() => new Set([currentMonthKey()]));
  function toggleMonth(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const sharedRowProps = { expandedId, setExpandedId, updating, updateStatus };

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      {/* Header */}
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Orders Dashboard</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="font-mono text-accent text-xs tracking-wider">Orders</span>
            <span className="text-slate">·</span>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/payouts" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Payouts</Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Status filter cards ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">Filter by Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* All */}
            <button
              onClick={() => setStatusFilter("all")}
              className={`bg-carbon border p-4 text-left transition-colors hover:border-accent/50 ${
                statusFilter === "all" ? "border-accent" : "border-slate"
              }`}
            >
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">All Orders</p>
              <p className="font-sans font-bold text-paper text-2xl">{orders.length}</p>
            </button>

            {(["pending_payment", "paid", "fulfilled", "cancelled"] as OrderStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`bg-carbon border p-4 text-left transition-colors ${
                  statusFilter === s
                    ? `${STATUS_SELECTED_BORDER[s]} bg-carbon`
                    : "border-slate hover:border-accent/30"
                }`}
              >
                <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">
                  {STATUS_LABELS[s]}
                </p>
                <p className={`font-sans font-bold text-2xl ${statusFilter === s ? STATUS_COLORS[s].split(" ")[1] : "text-paper"}`}>
                  {statusCounts[s] ?? 0}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Financials (always fulfilled, unfiltered) ── */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">
              Financials — Fulfilled Orders
            </p>
            {totalCogs === 0 && (
              <span className="font-mono text-[9px] text-yellow-400 border border-yellow-500/40 px-2 py-0.5 tracking-wider">
                COGS NOT CONFIGURED — edit lib/cogs.ts
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Revenue</p>
              <p className="font-sans font-bold text-accent text-2xl">{fmtDollars(fulfilledRevenue)}</p>
              <p className="font-mono text-bone text-[10px] mt-1">{fulfilledOrders.length} orders</p>
            </div>
            <div className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">COGS</p>
              <p className="font-sans font-bold text-red-400 text-2xl">{fmtDollars(totalCogs)}</p>
              <p className="font-mono text-bone text-[10px] mt-1">cost of goods</p>
            </div>
            <div className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Gross Profit</p>
              <p className={`font-sans font-bold text-2xl ${grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {fmtDollars(grossProfit)}
              </p>
              <p className="font-mono text-bone text-[10px] mt-1">revenue − COGS</p>
            </div>
            <div className="bg-carbon border border-slate p-4">
              <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Gross Margin</p>
              <p className={`font-sans font-bold text-2xl ${marginColor(marginPct)}`}>
                {fulfilledRevenue > 0 ? `${marginPct}%` : "—"}
              </p>
              <p className="font-mono text-bone text-[10px] mt-1">profit / revenue</p>
            </div>
          </div>
        </div>

        {/* ── Order list header + view toggle ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">
              {statusFilter === "all"
                ? `All Orders · ${filtered.length}`
                : `${STATUS_LABELS[statusFilter]} · ${filtered.length} order${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center border border-slate">
            {(["list", "month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`font-mono text-[10px] px-4 py-2 tracking-wider transition-colors ${
                  viewMode === v ? "bg-accent text-obsidian font-bold" : "text-bone hover:text-accent"
                }`}
              >
                {v === "list" ? "List" : "By Month"}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-bone font-mono text-sm">
            No {statusFilter === "all" ? "" : STATUS_LABELS[statusFilter].toLowerCase() + " "}orders found.
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === "list" && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderRow key={order.id} order={order} {...sharedRowProps} />
            ))}
          </div>
        )}

        {/* ── Month view ── */}
        {viewMode === "month" && filtered.length > 0 && (
          <div className="space-y-4">
            {monthGroups.map(([key, monthOrders]) => {
              const isOpen    = openMonths.has(key);
              const revenue   = monthOrders.reduce((s, o) => s + parseAmount(o.orderTotal ?? o.subtotal), 0);
              const fulfilled = monthOrders.filter((o) => o.status === "fulfilled").length;
              const pending   = monthOrders.filter((o) => o.status === "pending_payment").length;
              const paid      = monthOrders.filter((o) => o.status === "paid").length;

              return (
                <div key={key}>
                  {/* Month header */}
                  <button
                    onClick={() => toggleMonth(key)}
                    className="w-full flex items-center justify-between gap-4 bg-carbon border border-slate px-5 py-4 hover:bg-obsidian/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-sans font-bold text-paper">{monthLabel(key)}</p>
                        <p className="font-mono text-[10px] text-bone/50 mt-0.5">
                          {monthOrders.length} order{monthOrders.length !== 1 ? "s" : ""}
                          {fulfilled > 0 && <span className="text-green-400 ml-2">{fulfilled} fulfilled</span>}
                          {paid      > 0 && <span className="text-blue-400  ml-2">{paid} paid</span>}
                          {pending   > 0 && <span className="text-yellow-400 ml-2">{pending} pending</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-mono text-[10px] text-bone/40">Revenue</p>
                        <p className="font-mono text-accent font-bold">{fmtDollars(revenue)}</p>
                      </div>
                      <span className={`font-mono text-bone/40 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </div>
                  </button>

                  {/* Month order rows */}
                  {isOpen && (
                    <div className="space-y-1 mt-1 pl-4 border-l-2 border-slate/40">
                      {monthOrders.map((order) => (
                        <OrderRow key={order.id} order={order} {...sharedRowProps} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

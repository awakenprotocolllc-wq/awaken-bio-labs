"use client";

import { useState } from "react";
import Link from "next/link";
import { type Order, type OrderStatus } from "@/lib/db";
import { getUnitCost, calcOrderCogs, fmtDollars } from "@/lib/cogs";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  fulfilled: "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
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

export default function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // ── Order status counts ──────────────────────────────────────────────────
  const statusCounts = orders.reduce(
    (acc, o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  // ── COGS & revenue — fulfilled orders only ───────────────────────────────
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled");

  const fulfilledRevenue = fulfilledOrders.reduce(
    (sum, o) => sum + parseAmount(o.orderTotal ?? o.subtotal),
    0
  );
  const totalCogs = fulfilledOrders.reduce(
    (sum, o) => sum + calcOrderCogs(o.items),
    0
  );
  const grossProfit = fulfilledRevenue - totalCogs;
  const marginPct = fulfilledRevenue > 0
    ? Math.round((grossProfit / fulfilledRevenue) * 100)
    : 0;

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
            <Link
              href="/admin/affiliates"
              className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors"
            >
              Affiliates
            </Link>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Order status counts ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">Order Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["pending_payment", "paid", "fulfilled", "cancelled"] as OrderStatus[]).map((s) => (
              <div key={s} className="bg-carbon border border-slate p-4">
                <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">
                  {STATUS_LABELS[s]}
                </p>
                <p className="font-sans font-bold text-paper text-2xl">{statusCounts[s] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── COGS / financials — fulfilled only ── */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase">
              Financials — Fulfilled Orders Only
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

        {orders.length === 0 && (
          <div className="text-center py-20 text-bone font-mono text-sm">
            No orders yet. Orders will appear here once customers place them.
          </div>
        )}

        {/* ── Orders list ── */}
        <div>
          <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">All Orders</p>
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const orderCogs = calcOrderCogs(order.items);
              const orderRevenue = parseAmount(order.orderTotal ?? order.subtotal);
              const orderProfit = orderRevenue - orderCogs;
              const orderMargin = orderRevenue > 0
                ? Math.round((orderProfit / orderRevenue) * 100)
                : 0;
              const isFulfilled = order.status === "fulfilled";

              return (
                <div key={order.id} className="bg-carbon border border-slate">
                  {/* Row header */}
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

                    {/* Status badge */}
                    <div className="hidden sm:block">
                      <span className={`font-mono text-[10px] px-2 py-1 border tracking-wider ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {/* Status selector */}
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

                  {/* Expanded details */}
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
                        {/* Customer */}
                        <div>
                          <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">CUSTOMER</p>
                          <p className="text-paper font-semibold text-sm">{order.customer.name}</p>
                          <p className="text-bone text-sm">{order.customer.email}</p>
                          {order.customer.phone && <p className="text-bone text-sm">{order.customer.phone}</p>}
                        </div>

                        {/* Ship to */}
                        <div>
                          <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-3">SHIP TO</p>
                          <p className="text-paper text-sm leading-relaxed">
                            {order.shipping.line1}<br />
                            {order.shipping.city}, {order.shipping.state} {order.shipping.zip}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
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

                      {/* ── COGS / financials panel (fulfilled only) ── */}
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
                              {" · "}
                              Commission: <span className="text-accent">
                                {fmtDollars(parseAmount(order.subtotal) * 0.20)}
                              </span>
                              {" "}
                              <span className="text-bone/50">(20% of subtotal)</span>
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
                          <p className="text-bone text-sm leading-relaxed bg-obsidian border border-slate px-4 py-3">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { validateAdminSession } from "@/lib/admin-auth";
import { getCustomerById, getCustomerOrderIds } from "@/lib/customer-db";
import { getOrder } from "@/lib/db";
import AdminCustomerNoteForm from "./NoteForm";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) redirect("/admin/login");

  const customer = await getCustomerById(params.id);
  if (!customer) notFound();

  const orderIds = await getCustomerOrderIds(params.id);
  const orders = (await Promise.all(orderIds.map((id) => getOrder(id)))).filter(Boolean);
  const totalSpend = orders.reduce((sum, o) => {
    const n = parseFloat((o!.orderTotal ?? o!.subtotal).replace(/[^0-9.]/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  function fmtDate(iso: string | null | undefined) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const STATUS_BADGE: Record<string, string> = {
    pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    paid:            "bg-blue-500/20 text-blue-400 border-blue-500/40",
    fulfilled:       "bg-green-500/20 text-green-400 border-green-500/40",
    cancelled:       "bg-red-500/20 text-red-400 border-red-500/40",
  };

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Nav */}
      <div className="border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6 flex-wrap">
          <Link href="/admin/customers" className="font-mono text-accent text-xs tracking-wider hover:underline">← Customers</Link>
          <div className="flex gap-4">
            <Link href="/admin/orders"    className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <Link href="/admin/affiliates" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Partners</Link>
            <Link href="/admin/payouts"   className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Payouts</Link>
            <span className="font-mono text-accent text-xs tracking-wider">Customers</span>
            <Link href="/admin/system"    className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Customer header */}
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-14 h-14 bg-accent/10 border border-accent/30 flex items-center justify-center font-mono text-accent text-base font-bold shrink-0">
            {customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h1 className="font-sans font-bold text-paper text-2xl">{customer.name}</h1>
            <p className="font-mono text-bone text-sm mt-0.5">{customer.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {customer.emailVerified
                ? <span className="font-mono text-[9px] text-green-400 border border-green-400/30 px-2 py-1 tracking-wider">EMAIL VERIFIED</span>
                : <span className="font-mono text-[9px] text-yellow-400 border border-yellow-400/30 px-2 py-1 tracking-wider">UNVERIFIED</span>
              }
              {customer.marketingOptIn && (
                <span className="font-mono text-[9px] text-accent border border-accent/30 px-2 py-1 tracking-wider">MARKETING OPT-IN</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Orders",      value: orders.length },
            { label: "Total Spend", value: `$${totalSpend.toFixed(2)}` },
            { label: "Joined",      value: fmtDate(customer.createdAt) },
            { label: "Last Login",  value: fmtDate(customer.lastLoginAt) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-carbon border border-slate px-4 py-4">
              <p className="font-mono text-bone/40 text-[10px] tracking-wider uppercase mb-1">{label}</p>
              <p className="font-sans font-bold text-paper text-lg">{value}</p>
            </div>
          ))}
        </div>

        {/* Addresses */}
        {customer.addresses.length > 0 && (
          <div>
            <p className="font-mono text-accent text-xs tracking-wider mb-3">Saved Addresses</p>
            <div className="space-y-2">
              {customer.addresses.map((a) => (
                <div key={a.id} className="bg-carbon border border-slate px-4 py-3 flex items-center gap-3">
                  {a.isDefault && (
                    <span className="font-mono text-[9px] text-accent border border-accent/30 px-1.5 py-0.5 shrink-0">DEFAULT</span>
                  )}
                  <p className="font-sans text-bone text-sm">{a.line1}, {a.city}, {a.state} {a.zip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin note */}
        <div>
          <p className="font-mono text-accent text-xs tracking-wider mb-3">Internal Note</p>
          <AdminCustomerNoteForm customerId={customer.id} initialNote={customer.adminNote ?? ""} />
        </div>

        {/* Orders */}
        <div>
          <p className="font-mono text-accent text-xs tracking-wider mb-3">Orders ({orders.length})</p>
          {orders.length === 0 ? (
            <p className="font-mono text-bone/30 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order!.id} className="bg-carbon border border-slate px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-accent text-xs tracking-wider">#{order!.id.toUpperCase()}</p>
                    <p className="font-sans text-paper text-sm mt-1">
                      {new Date(order!.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="font-sans text-bone text-xs mt-1">
                      {order!.items.map((i) => `${i.product} ×${i.qty}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[9px] px-2 py-1 border tracking-wider ${STATUS_BADGE[order!.status] ?? ""}`}>
                      {order!.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="font-mono text-accent text-sm font-bold">
                      {order!.orderTotal ?? order!.subtotal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

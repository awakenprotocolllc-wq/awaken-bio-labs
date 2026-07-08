import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { kv } from "@vercel/kv";
import { validateAdminSession } from "@/lib/admin-auth";
import { getAbandonedCart, getReminderScheduleHours, MAX_REMINDER_STAGES, type AbandonedCartRecord } from "@/lib/abandoned-cart";
import { getCustomerById } from "@/lib/customer-db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abandoned Carts · Admin · Awaken Bio Labs" };

type Row = AbandonedCartRecord & { customerName: string; customerEmail: string };

function fmtWhen(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function cartValue(r: AbandonedCartRecord): string {
  const total = r.items.reduce((s, i) => {
    const n = parseFloat(i.price.replace(/[^0-9.]/g, ""));
    return s + (isNaN(n) ? 0 : n) * i.qty;
  }, 0);
  return `$${total.toFixed(2)}`;
}

function nextReminder(r: AbandonedCartRecord, schedule: [number, number, number]): string {
  if (r.status !== "active") return "—";
  for (let s = 1; s <= MAX_REMINDER_STAGES; s++) {
    if (!r.sentStages[String(s)]) {
      const dueAt = Date.parse(r.lastActivityAt) + schedule[s - 1] * 3_600_000;
      return `#${s} · ${fmtWhen(new Date(dueAt).toISOString())}`;
    }
  }
  return "—";
}

const STATUS_STYLE: Record<string, string> = {
  active:             "bg-blue-500/20 text-blue-400 border-blue-500/40",
  converted:          "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled:          "bg-slate/40 text-bone/60 border-slate",
  completed_sequence: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
};

export default async function AbandonedCartsPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) redirect("/admin/login");

  const schedule = getReminderScheduleHours();
  const ids = ((await kv.zrange("acr:index", 0, 99, { rev: true })) as string[]) ?? [];

  const rows: Row[] = [];
  for (const id of ids) {
    const record = await getAbandonedCart(id);
    if (!record) continue;
    const customer = await getCustomerById(id);
    rows.push({
      ...record,
      customerName: customer?.name ?? "(deleted account)",
      customerEmail: customer?.email ?? "—",
    });
  }

  const active = rows.filter((r) => r.status === "active").length;
  const recovered = rows.filter((r) => r.status === "converted" && r.reminderAssociated).length;

  return (
    <div className="min-h-screen bg-obsidian text-paper">
      <div className="bg-carbon border-b border-slate px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase">Awaken Bio Labs</p>
            <h1 className="font-sans font-bold text-paper text-xl">Abandoned Carts</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/admin/orders" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Orders</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/products" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Products</Link>
            <span className="text-slate">·</span>
            <span className="font-mono text-accent text-xs tracking-wider">Carts</span>
            <span className="text-slate">·</span>
            <Link href="/admin/customers" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">Customers</Link>
            <span className="text-slate">·</span>
            <Link href="/admin/system" className="font-mono text-bone text-xs tracking-wider hover:text-accent transition-colors">System</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Tracked Carts</p>
            <p className="font-sans font-bold text-paper text-2xl">{rows.length}</p>
          </div>
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Active Sequences</p>
            <p className="font-sans font-bold text-blue-400 text-2xl">{active}</p>
          </div>
          <div className="bg-carbon border border-slate p-4">
            <p className="font-mono text-bone text-[10px] tracking-wider uppercase mb-1">Reminder-Associated Orders</p>
            <p className="font-sans font-bold text-green-400 text-2xl">{recovered}</p>
          </div>
        </div>

        <div className="bg-carbon border border-slate overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate">
                {["Customer", "Status", "Value", "Items", "Last Activity", "Sent", "Next Reminder", "Outcome"].map((h) => (
                  <th key={h} className="text-left font-mono text-bone text-[10px] tracking-wider uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.customerId} className="border-b border-slate/50 hover:bg-obsidian/40">
                  <td className="px-4 py-3">
                    <p className="font-sans font-semibold text-paper text-xs">{r.customerName}</p>
                    <p className="font-mono text-bone/60 text-[10px]">{r.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[9px] px-2 py-1 border tracking-wider uppercase ${STATUS_STYLE[r.status] ?? ""}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-accent text-xs font-bold">{cartValue(r)}</td>
                  <td className="px-4 py-3 font-mono text-bone text-xs">{r.items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="px-4 py-3 font-mono text-bone text-xs">{fmtWhen(r.lastActivityAt)}</td>
                  <td className="px-4 py-3 font-mono text-bone text-xs">
                    {Object.keys(r.sentStages).length > 0
                      ? Object.keys(r.sentStages).sort().map((s) => `#${s}`).join(" ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-bone text-xs">{nextReminder(r, schedule)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.status === "converted" && r.recoveredOrderId ? (
                      <span className="text-green-400">
                        Order #{r.recoveredOrderId.toUpperCase()}
                        {r.reminderAssociated && <span className="block text-[9px] text-bone/50">reminder-associated</span>}
                      </span>
                    ) : r.status === "cancelled" ? (
                      <span className="text-bone/50">{r.cancelReason?.replace(/_/g, " ")}</span>
                    ) : (
                      <span className="text-bone/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-bone font-mono text-sm">
                    No abandoned carts tracked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="font-mono text-bone/40 text-[11px] leading-relaxed max-w-3xl">
          Reminders send only to verified, marketing-subscribed customers, at most {MAX_REMINDER_STAGES} per
          cart ({schedule.join("h / ")}h after last activity). &ldquo;Reminder-associated&rdquo; means a reminder
          was sent before the order — correlation, not proven causation.
        </p>
      </div>
    </div>
  );
}

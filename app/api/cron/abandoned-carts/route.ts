import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { processAbandonedCarts } from "@/lib/abandoned-cart";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/cron/abandoned-carts — hourly Vercel cron (see vercel.json).
// Auth: Bearer CRON_SECRET (Vercel cron) or an admin session (manual run).
// Safe to invoke repeatedly: the processor is idempotent per stage via NX
// locks and post-lock re-reads.
export async function GET(req: NextRequest) {
  const CRON_SECRET = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCron = CRON_SECRET ? authHeader === `Bearer ${CRON_SECRET}` : false;
  const isAdmin = await validateAdminSession(req.cookies.get("awaken_admin")?.value);

  if (!isCron && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await processAbandonedCarts();
    console.log("[cron/abandoned-carts]", JSON.stringify(summary));
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[cron/abandoned-carts]", err);
    return NextResponse.json({ ok: false, error: "Processing error" }, { status: 500 });
  }
}

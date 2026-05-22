import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * GET /api/health
 * 24-hour site-wide health check (also callable manually).
 * Runs as a Vercel Cron job — see vercel.json.
 *
 * Checks:
 *  1. KV connectivity — write + read a probe key
 *  2. Affiliate system — listAffiliates returns without error
 *  3. Orders system — listOrders returns without error
 *  4. Product data — products list loads
 *  5. Environment variables — critical env vars are set
 */

const CRON_SECRET = process.env.CRON_SECRET;
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
  ms?: number;
};

async function runCheck(name: string, fn: () => Promise<string | void>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, detail: detail ?? undefined, ms: Date.now() - start };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { name, ok: false, detail: message, ms: Date.now() - start };
  }
}

export async function GET(req: NextRequest) {
  // Allow admin browser checks (admin cookie) and cron calls (Authorization header)
  const authHeader = req.headers.get("authorization");
  const adminCookie = req.cookies.get("awaken_admin")?.value;
  const adminToken = process.env.ADMIN_SESSION_TOKEN;

  const isCron = CRON_SECRET ? authHeader === `Bearer ${CRON_SECRET}` : false;
  const isAdmin = !!adminToken && adminCookie === adminToken;

  if (!isCron && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const checks: CheckResult[] = [];

  // 1. Environment variables
  checks.push(await runCheck("env-vars", async () => {
    const required = ["ADMIN_SESSION_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "RESEND_API_KEY", "NEXT_PUBLIC_SITE_URL"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
    return `All ${required.length} required vars set`;
  }));

  // 2. KV connectivity
  checks.push(await runCheck("kv-connectivity", async () => {
    const probeKey = "health:probe:" + Date.now();
    await kv.set(probeKey, "ok", { ex: 60 });
    const val = await kv.get(probeKey);
    await kv.del(probeKey);
    if (val !== "ok") throw new Error("KV read-back mismatch");
    return "KV read/write OK";
  }));

  // 3. Affiliate system
  checks.push(await runCheck("affiliate-system", async () => {
    const { listAffiliates, listApplications } = await import("@/lib/affiliate-db");
    const [affiliates, apps] = await Promise.all([listAffiliates(), listApplications()]);
    return `${affiliates.length} affiliates, ${apps.length} applications`;
  }));

  // 4. Orders system
  checks.push(await runCheck("orders-system", async () => {
    const { listOrders } = await import("@/lib/db");
    const orders = await listOrders();
    return `${orders.length} orders`;
  }));

  // 5. Products / COGS config
  checks.push(await runCheck("products-config", async () => {
    const { products } = await import("@/lib/products");
    if (!products || products.length === 0) throw new Error("Products list is empty");
    return `${products.length} products configured`;
  }));

  // 6. Discount code validation (smoke test with a dummy code — should return valid:false)
  checks.push(await runCheck("discount-validation", async () => {
    const { validateDiscountCode } = await import("@/lib/affiliate-db");
    const result = await validateDiscountCode("HEALTHCHECK_PROBE_INVALID");
    if (result.valid !== false) throw new Error("Unexpected: probe code returned valid=true");
    return "Discount validation returns correct invalid response";
  }));

  const allOk = checks.every((c) => c.ok);
  const timestamp = new Date().toISOString();

  // Store last-run result in KV so you can check it in the admin portal
  try {
    await kv.set("health:last-run", { timestamp, allOk, checks }, { ex: 60 * 60 * 25 }); // 25h TTL
  } catch { /* non-fatal */ }

  // Send alert email if anything failed
  if (!allOk) {
    const failedNames = checks.filter((c) => !c.ok).map((c) => c.name).join(", ");
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: ["support@awakenbiolabs.com"],
            subject: `⚠ Site Health Alert — ${failedNames} failed`,
            html: `
              <h2>Site Health Check Failed</h2>
              <p>Time: ${timestamp}</p>
              <p>Site: ${SITE}</p>
              <p>Failed checks: <strong>${failedNames}</strong></p>
              <table border="1" cellpadding="6" cellspacing="0">
                <tr><th>Check</th><th>Status</th><th>Detail</th><th>Time (ms)</th></tr>
                ${checks.map((c) => `
                  <tr>
                    <td>${c.name}</td>
                    <td style="color:${c.ok ? "green" : "red"}">${c.ok ? "✓ OK" : "✗ FAILED"}</td>
                    <td>${c.detail ?? ""}</td>
                    <td>${c.ms ?? ""}</td>
                  </tr>
                `).join("")}
              </table>
              <p>Log in to <a href="${SITE}/admin">admin portal</a> to investigate.</p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error("[health] alert email failed:", emailErr);
      }
    }
  }

  return NextResponse.json(
    { ok: allOk, timestamp, site: SITE, checks },
    { status: allOk ? 200 : 503 }
  );
}

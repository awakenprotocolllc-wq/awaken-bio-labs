import { NextRequest, NextResponse } from "next/server";
import {
  validateCustomerLogin, createCustomerSession,
  getCustomerByEmail, createCustomer,
} from "@/lib/customer-db";
import { validateAffiliateLogin } from "@/lib/affiliate-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

const COOKIE_OPTS = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge,
  path: "/",
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:login:${ip}`, 10, 60 * 15);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });

    const body = await req.json();
    const email: string    = (body.email ?? "").trim().toLowerCase();
    const password: string = body.password ?? "";
    const rememberMe: boolean = body.rememberMe === true;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const maxAge  = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const context = { ip, ua: req.headers.get("user-agent") ?? "" };

    // ── 1. Try standard customer auth ────────────────────────────────────────
    const customer = await validateCustomerLogin(email, password);
    if (customer) {
      const sessionToken = await createCustomerSession(customer.id, context, rememberMe);
      const res = NextResponse.json({ ok: true, customer });
      res.cookies.set("awaken_customer", sessionToken, COOKIE_OPTS(maxAge));
      return res;
    }

    // ── 2. Fall through: try affiliate credentials ───────────────────────────
    // Allows ambassadors/licensees to use their partner login on the storefront.
    const affiliate = await validateAffiliateLogin(email, password);
    if (!affiliate) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    // Get or create a shadow customer account linked to this affiliate's email.
    // Created once; subsequent logins reuse it.
    let shadowCustomer = await getCustomerByEmail(email);
    if (!shadowCustomer) {
      shadowCustomer = await createCustomer(email, affiliate.name, password);
    }

    const sessionToken = await createCustomerSession(shadowCustomer.id, context, rememberMe);
    const res = NextResponse.json({ ok: true, customer: shadowCustomer });
    res.cookies.set("awaken_customer", sessionToken, COOKIE_OPTS(maxAge));
    return res;

  } catch (err) {
    return apiError("customer:login", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateCustomerLogin, createCustomerSession } from "@/lib/customer-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:login:${ip}`, 10, 60 * 15);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many login attempts. Try again in 15 minutes." }, { status: 429 });

    const body = await req.json();
    const email: string  = (body.email ?? "").trim().toLowerCase();
    const password: string = body.password ?? "";
    const rememberMe: boolean = body.rememberMe === true;

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const customer = await validateCustomerLogin(email, password);
    if (!customer) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const context = { ip, ua: req.headers.get("user-agent") ?? "" };
    const sessionToken = await createCustomerSession(customer.id, context, rememberMe);

    const res = NextResponse.json({ ok: true, customer });
    res.cookies.set("awaken_customer", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    return apiError("customer:login", err);
  }
}

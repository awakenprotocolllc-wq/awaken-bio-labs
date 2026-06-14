import { NextRequest, NextResponse } from "next/server";
import {
  validateAffiliateLogin,
  createAffiliateSession,
  deleteAffiliateSession,
} from "@/lib/affiliate-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { containsAttack } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    // 20 attempts per 15 minutes per IP
    const { allowed } = await rateLimit(`affiliate-login:${clientIp(req)}`, 20, 60 * 15);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 400 });
    }
    if (containsAttack(email)) {
      console.warn("[affiliate/login] attack pattern in email, ip:", clientIp(req));
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 400 });
    }

    const account = await validateAffiliateLogin(email, password);
    if (!account) {
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }

    // Delete any existing session before creating a new one (prevents session fixation)
    const existingToken = req.cookies.get("awaken_affiliate")?.value;
    if (existingToken) await deleteAffiliateSession(existingToken);

    const context = {
      ip: clientIp(req),
      ua: req.headers.get("user-agent") ?? "",
    };
    const token = await createAffiliateSession(account.id, context);

    const res = NextResponse.json({ ok: true, user: account });
    res.cookies.set("awaken_affiliate", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    console.error("[affiliate/login]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

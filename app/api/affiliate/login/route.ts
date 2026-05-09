import { NextResponse } from "next/server";
import { validateAffiliateLogin, createAffiliateSession } from "@/lib/affiliate-db";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
    }

    const account = await validateAffiliateLogin(email, password);
    if (!account) {
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createAffiliateSession(account.id);

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

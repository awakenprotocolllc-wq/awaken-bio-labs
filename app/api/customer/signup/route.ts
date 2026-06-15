import { NextRequest, NextResponse } from "next/server";
import { createCustomer, createCustomerSession, createVerificationToken } from "@/lib/customer-db";
import { sendVerificationEmail } from "@/lib/customer-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const { allowed } = await rateLimit(`customer:signup:${ip}`, 5, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many signups. Try again later." }, { status: 429 });

    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const name: string  = (body.name  ?? "").trim();
    const password: string = body.password ?? "";
    const researcherCategory: string = (body.researcherCategory ?? "").trim();
    const businessType: string = (body.businessType ?? "").trim();
    const institution: string = (body.institution ?? "").trim();
    const certifiedAge: boolean = body.certifiedAge === true;

    if (!email || !name || !password) {
      return NextResponse.json({ ok: false, error: "Email, name, and password are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!researcherCategory) {
      return NextResponse.json({ ok: false, error: "Please select your researcher category." }, { status: 400 });
    }
    if (!businessType) {
      return NextResponse.json({ ok: false, error: "Please select your business type." }, { status: 400 });
    }
    if (!certifiedAge) {
      return NextResponse.json({ ok: false, error: "You must certify you are 21 or older and agree to the research use terms." }, { status: 400 });
    }

    const VALID_CATEGORIES = ["Analytical Chemistry", "Private Research Organization", "Education Institution", "Hospital/Medical Institution"];
    const VALID_BUSINESS_TYPES = ["Sole Proprietor", "LLC", "S-Corp", "C-Corp"];
    if (!VALID_CATEGORIES.includes(researcherCategory)) {
      return NextResponse.json({ ok: false, error: "Invalid researcher category." }, { status: 400 });
    }
    if (!VALID_BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json({ ok: false, error: "Invalid business type." }, { status: 400 });
    }

    let customer;
    try {
      customer = await createCustomer(email, name, password, { researcherCategory, businessType, institution: institution || undefined });
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_TAKEN") {
        return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
      }
      throw err;
    }

    // Send verification email (best-effort — don't fail signup if email fails)
    try {
      const verifyToken = await createVerificationToken(customer.id, customer.email);
      await sendVerificationEmail(customer.email, customer.name, verifyToken);
    } catch (err) {
      console.error("[customer:signup] Failed to send verification email:", err);
    }

    // Create session so the user is logged in immediately after signup
    const context = { ip, ua: req.headers.get("user-agent") ?? "" };
    const sessionToken = await createCustomerSession(customer.id, context);

    const res = NextResponse.json({ ok: true, customer });
    res.cookies.set("awaken_customer", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    return apiError("customer:signup", err);
  }
}

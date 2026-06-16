import { NextRequest, NextResponse } from "next/server";
import {
  getAffiliateSession,
  saveAffiliatePayment,
  getAffiliatePaymentDisplay,
  deleteAffiliatePayment,
} from "@/lib/affiliate-db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

const CARD_NUMBER_RE = /^\d{13,19}$/;
const MONTH_RE       = /^(0[1-9]|1[0-2])$/;
const YEAR_RE        = /^\d{4}$/;
const CVV_RE         = /^\d{3,4}$/;

async function resolveAccount(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) return null;
  return getAffiliateSession(token, { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" });
}

export async function GET(req: NextRequest) {
  try {
    const account = await resolveAccount(req);
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });

    const card = await getAffiliatePaymentDisplay(account.id);
    return NextResponse.json({ ok: true, card: card ?? null });
  } catch (err) {
    return apiError("GET /api/affiliate/payment", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`aff:payment:${clientIp(req)}`, 10, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

    const account = await resolveAccount(req);
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });
    if (account.status !== "active") return NextResponse.json({ ok: false, error: "Account not active." }, { status: 403 });

    const body = await req.json();
    const { number, holderName, expiryMonth, expiryYear, cvv } = body ?? {};

    const digits = typeof number === "string" ? number.replace(/\D/g, "") : "";
    if (!CARD_NUMBER_RE.test(digits)) {
      return NextResponse.json({ ok: false, error: "Invalid card number." }, { status: 400 });
    }
    if (typeof holderName !== "string" || !holderName.trim() || holderName.length > 100) {
      return NextResponse.json({ ok: false, error: "Cardholder name is required." }, { status: 400 });
    }
    if (typeof expiryMonth !== "string" || !MONTH_RE.test(expiryMonth)) {
      return NextResponse.json({ ok: false, error: "Invalid expiry month." }, { status: 400 });
    }
    if (typeof expiryYear !== "string" || !YEAR_RE.test(expiryYear)) {
      return NextResponse.json({ ok: false, error: "Invalid expiry year." }, { status: 400 });
    }
    if (typeof cvv !== "string" || !CVV_RE.test(cvv)) {
      return NextResponse.json({ ok: false, error: "Invalid CVV." }, { status: 400 });
    }

    // Expiry must be in the future
    const now = new Date();
    const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1, 1);
    if (expiry < new Date(now.getFullYear(), now.getMonth(), 1)) {
      return NextResponse.json({ ok: false, error: "Card is expired." }, { status: 400 });
    }

    const display = await saveAffiliatePayment(account.id, {
      number: digits,
      holderName: holderName.trim(),
      expiryMonth,
      expiryYear,
      cvv,
    });

    return NextResponse.json({ ok: true, card: display });
  } catch (err) {
    return apiError("POST /api/affiliate/payment", err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(`aff:payment:del:${clientIp(req)}`, 10, 60 * 60);
    if (!allowed) return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });

    const account = await resolveAccount(req);
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });

    await deleteAffiliatePayment(account.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("DELETE /api/affiliate/payment", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, saveAffiliateAddress, getAffiliateAddress } from "@/lib/affiliate-db";
import { clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

async function resolveAccount(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) return null;
  return getAffiliateSession(token, { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" });
}

export async function GET(req: NextRequest) {
  try {
    const account = await resolveAccount(req);
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });

    const address = await getAffiliateAddress(account.id);
    return NextResponse.json({ ok: true, address: address ?? null });
  } catch (err) {
    return apiError("GET /api/affiliate/address", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const account = await resolveAccount(req);
    if (!account) return NextResponse.json({ ok: false }, { status: 401 });
    if (account.status !== "active") return NextResponse.json({ ok: false, error: "Account not active." }, { status: 403 });

    const body = await req.json();
    const { line1, city, state, zip } = body ?? {};

    if (
      typeof line1 !== "string" || !line1.trim() ||
      typeof city  !== "string" || !city.trim()  ||
      typeof state !== "string" || !state.trim() ||
      typeof zip   !== "string" || !zip.trim()
    ) {
      return NextResponse.json({ ok: false, error: "All address fields are required." }, { status: 400 });
    }
    if (line1.length > 200 || city.length > 100 || state.length > 50 || zip.length > 20) {
      return NextResponse.json({ ok: false, error: "Address fields are too long." }, { status: 400 });
    }

    await saveAffiliateAddress(account.id, {
      line1: line1.trim(),
      city:  city.trim(),
      state: state.trim(),
      zip:   zip.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("POST /api/affiliate/address", err);
  }
}

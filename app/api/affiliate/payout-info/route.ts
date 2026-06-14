import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSession, saveAffiliatePayoutInfo, getAffiliatePayoutInfo } from "@/lib/affiliate-db";

async function getSession(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (!token) return null;
  return getAffiliateSession(token);
}

// GET — returns masked payout info for the affiliate
export async function GET(req: NextRequest) {
  const account = await getSession(req);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });

  const info = await getAffiliatePayoutInfo(account.id);
  if (!info) return NextResponse.json({ ok: true, info: null });

  // Mask account number — show last 4 only
  return NextResponse.json({
    ok: true,
    info: {
      holderName: info.holderName,
      bankName: info.bankName,
      routingNumber: info.routingNumber,
      accountLast4: info.accountNumber.slice(-4),
      accountType: info.accountType,
      updatedAt: info.updatedAt,
    },
  });
}

// POST — save payout info
export async function POST(req: NextRequest) {
  const account = await getSession(req);
  if (!account) return NextResponse.json({ ok: false }, { status: 401 });

  const { holderName, bankName, routingNumber, accountNumber, accountType } = await req.json();

  if (typeof holderName !== "string" || typeof routingNumber !== "string" || typeof accountNumber !== "string") {
    return NextResponse.json({ ok: false, error: "Holder name, routing number, and account number are required." }, { status: 400 });
  }
  if (!holderName.trim() || !routingNumber.trim() || !accountNumber.trim()) {
    return NextResponse.json({ ok: false, error: "Holder name, routing number, and account number are required." }, { status: 400 });
  }
  if (holderName.trim().length > 200) {
    return NextResponse.json({ ok: false, error: "Holder name is too long." }, { status: 400 });
  }
  if (bankName !== undefined && (typeof bankName !== "string" || bankName.length > 200)) {
    return NextResponse.json({ ok: false, error: "Bank name is too long." }, { status: 400 });
  }
  if (!/^\d{9}$/.test(routingNumber.replace(/\s/g, ""))) {
    return NextResponse.json({ ok: false, error: "Routing number must be 9 digits." }, { status: 400 });
  }
  const cleanAccount = accountNumber.replace(/\s/g, "");
  if (!/^\d{4,17}$/.test(cleanAccount)) {
    return NextResponse.json({ ok: false, error: "Account number must be 4–17 digits." }, { status: 400 });
  }
  if (!["checking", "savings"].includes(accountType)) {
    return NextResponse.json({ ok: false, error: "Account type must be checking or savings." }, { status: 400 });
  }

  await saveAffiliatePayoutInfo(account.id, {
    holderName: holderName.trim(),
    bankName: bankName?.trim() ?? "",
    routingNumber: routingNumber.replace(/\s/g, ""),
    accountNumber: accountNumber.replace(/\s/g, ""),
    accountType,
  });

  return NextResponse.json({ ok: true });
}

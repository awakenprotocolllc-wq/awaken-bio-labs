import { NextRequest, NextResponse } from "next/server";
import { deleteAffiliateSession } from "@/lib/affiliate-db";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("awaken_affiliate")?.value;
  if (token) await deleteAffiliateSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("awaken_affiliate", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return res;
}

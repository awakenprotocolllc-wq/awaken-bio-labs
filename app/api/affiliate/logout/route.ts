import { NextRequest, NextResponse } from "next/server";
import { deleteAffiliateSession } from "@/lib/affiliate-db";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_affiliate")?.value;
    if (token) await deleteAffiliateSession(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("awaken_affiliate", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch (err) {
    return apiError("POST /api/affiliate/logout", err);
  }
}

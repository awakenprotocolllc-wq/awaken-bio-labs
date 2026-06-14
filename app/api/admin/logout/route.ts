import { NextRequest, NextResponse } from "next/server";
import { deleteAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("awaken_admin")?.value;
  if (token) await deleteAdminSession(token); // invalidate server-side immediately

  const res = NextResponse.json({ ok: true });
  res.cookies.set("awaken_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

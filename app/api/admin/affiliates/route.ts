import { NextRequest, NextResponse } from "next/server";
import { listApplications, listAffiliates } from "@/lib/affiliate-db";

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("awaken_admin")?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!expected && token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const [applications, affiliates] = await Promise.all([
    listApplications(),
    listAffiliates(),
  ]);

  return NextResponse.json({ ok: true, applications, affiliates });
}

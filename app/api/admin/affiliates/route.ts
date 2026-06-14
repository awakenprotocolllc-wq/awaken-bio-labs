import { NextRequest, NextResponse } from "next/server";
import { listApplications, listAffiliates } from "@/lib/affiliate-db";
import { validateAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) return NextResponse.json({ ok: false }, { status: 401 });

  const [applications, affiliates] = await Promise.all([
    listApplications(),
    listAffiliates(),
  ]);

  return NextResponse.json({ ok: true, applications, affiliates });
}

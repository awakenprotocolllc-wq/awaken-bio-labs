import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { listCustomers } from "@/lib/customer-db";
import { canSendMarketingEmail } from "@/lib/marketing-consent";
import { apiError } from "@/lib/api-error";

// GET /api/admin/marketing-eligible — admin only.
//
// Returns the set of customer emails that are ACTUALLY eligible for marketing
// per the central consent model (profile opt-in alone is not sufficient — the
// address must be "subscribed" and not unsubscribed/suppressed/bounced/
// complained). The admin CSV export uses this so a suppressed address can
// never be exported as a sendable marketing contact.
export async function GET(req: NextRequest) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const customers = await listCustomers();
    const optedIn = customers.filter((c) => c.marketingOptIn);

    const eligible: string[] = [];
    await Promise.all(
      optedIn.map(async (c) => {
        if (await canSendMarketingEmail(c.email)) {
          eligible.push(c.email.toLowerCase());
        }
      })
    );

    return NextResponse.json({ ok: true, eligible });
  } catch (err) {
    return apiError("GET /api/admin/marketing-eligible", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getAffiliateSession,
  verifyAffiliatePassword,
  deleteAffiliateAccount,
} from "@/lib/affiliate-db";
import { sendAccountDeletionEmail } from "@/lib/affiliate-emails";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

function sessionContext(req: NextRequest) {
  return { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
}

// POST /api/affiliate/delete-account
// Body: { password: string }
// Permanently deletes the authenticated affiliate's account and all related data.
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);

    // 3 attempts per hour — a destructive irreversible action
    const { allowed } = await rateLimit(`delete-account:${ip}`, 3, 60 * 60);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Try again in an hour." },
        { status: 429 }
      );
    }

    const token = req.cookies.get("awaken_affiliate")?.value;
    if (!token) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

    const account = await getAffiliateSession(token, sessionContext(req));
    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Session expired. Please log in and try again." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body as { password?: string };
    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { ok: false, error: "Password is required to confirm deletion." },
        { status: 400 }
      );
    }

    const valid = await verifyAffiliatePassword(account.id, password);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Incorrect password." },
        { status: 403 }
      );
    }

    // Capture name + email before deletion (can't read them after)
    const { name, email } = account;

    const result = await deleteAffiliateAccount(account.id);
    if (!result) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    }

    // Send confirmation email to the now-deleted address — fire-and-forget
    sendAccountDeletionEmail(name, email).catch((err) =>
      console.error("[delete-account] confirmation email failed:", err)
    );

    // Clear the session cookie
    const res = NextResponse.json({
      ok: true,
      recordsDeleted: result.keysDeleted,
      ...(result.errors.length > 0 ? { warnings: result.errors } : {}),
    });
    res.cookies.set("awaken_affiliate", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return apiError("POST /api/affiliate/delete-account", err);
  }
}

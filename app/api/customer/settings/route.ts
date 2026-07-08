import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession, updateCustomer, changeCustomerPassword } from "@/lib/customer-db";
import { subscribeMarketing, unsubscribeMarketing } from "@/lib/marketing-consent";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-error";

// Bump when the marketing consent disclosure wording in AccountContent changes
const CONSENT_DISCLOSURE_VERSION = "2026-06-account-settings-v1";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    const context = { ip: clientIp(req), ua: req.headers.get("user-agent") ?? "" };
    const customer = await getCustomerSession(token, context);
    if (!customer) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "update_profile") {
      const { name, marketingOptIn } = body;
      const trimmedName = typeof name === "string" ? name.trim() : undefined;
      if (trimmedName !== undefined && (trimmedName.length === 0 || trimmedName.length > 120)) {
        return NextResponse.json({ ok: false, error: "Name must be between 1 and 120 characters." }, { status: 400 });
      }

      // Sync the marketing consent source of truth BEFORE flipping the UI
      // boolean, so the profile flag never disagrees with the central record.
      let effectiveOptIn: boolean | undefined =
        typeof marketingOptIn === "boolean" ? marketingOptIn : undefined;
      let consentNotice: string | undefined;

      if (effectiveOptIn === true) {
        // Owner-initiated opt-in from their authenticated account. May restore
        // a prior "unsubscribed" state, but never overrides bounce/complaint/
        // admin suppression.
        const result = await subscribeMarketing(customer.email, {
          source: "account_settings",
          customerId: customer.id,
          ip: context.ip,
          userAgent: context.ua,
          consentDisclosureVersion: CONSENT_DISCLOSURE_VERSION,
          resubscribe: true,
          actor: `customer:${customer.id}`,
        });
        if (!result.ok) {
          effectiveOptIn = false; // keep the profile flag consistent with reality
          consentNotice =
            "Marketing emails could not be re-enabled for this address. Contact support if you believe this is an error.";
        }
      } else if (effectiveOptIn === false) {
        await unsubscribeMarketing(customer.email, {
          source: "account_settings",
          actor: `customer:${customer.id}`,
        });
      }

      const updated = await updateCustomer(customer.id, {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(typeof effectiveOptIn === "boolean" ? { marketingOptIn: effectiveOptIn } : {}),
      });
      // Strip adminNote — must not be visible to the customer
      const { adminNote: _adminNote, ...updatedPublic } = updated ?? {};
      return NextResponse.json({ ok: true, customer: updatedPublic, consentNotice });
    }

    if (action === "change_password") {
      const { allowed } = await rateLimit(`customer:change-pw:${customer.id}`, 5, 60 * 15);
      if (!allowed) return NextResponse.json({ ok: false, error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ ok: false, error: "Both current and new password are required." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400 });
      }
      const ok = await changeCustomerPassword(customer.id, currentPassword, newPassword);
      if (!ok) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect." }, { status: 400 });
      }
      // Session is still valid (the current session survives; other sessions are invalidated via passwordVersion bump)
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return apiError("customer:settings", err);
  }
}

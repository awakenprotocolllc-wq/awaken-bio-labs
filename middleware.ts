import { NextRequest, NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { getAffiliateSession } from "@/lib/affiliate-db";
import { clientIp } from "@/lib/rate-limit";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const context = {
    ip: clientIp(req),
    ua: req.headers.get("user-agent") ?? "",
  };

  // ------------------------------------------------------------------
  // 0. CSRF protection: verify Origin on state-changing API requests
  //    SameSite=Lax cookies are the primary guard; this is defense-in-depth
  //    for pre-2020 browsers that don't enforce SameSite.
  //    Webhooks (/api/webhooks/*) are server-to-server and never send Origin.
  // ------------------------------------------------------------------
  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/webhooks/")
  ) {
    const origin = req.headers.get("origin");
    if (origin) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";
      let expectedOrigin: string;
      try {
        expectedOrigin = new URL(siteUrl).origin;
      } catch {
        expectedOrigin = siteUrl;
      }
      const allowed =
        origin === expectedOrigin ||
        (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost(:\d+)?$/.test(origin));
      if (!allowed) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
      }
    }
  }

  // ------------------------------------------------------------------
  // 1. Protect /admin/* (except /admin/login)
  //    Validates token against KV with IP/UA binding.
  // ------------------------------------------------------------------
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("awaken_admin")?.value;
    const valid = await validateAdminSession(token, context);
    if (!valid) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  // ------------------------------------------------------------------
  // 2. Protect /affiliates/dashboard/* — verify session exists in KV
  //    with IP/UA binding.
  // ------------------------------------------------------------------
  if (pathname.startsWith("/affiliates/dashboard")) {
    const token = req.cookies.get("awaken_affiliate")?.value;
    if (!token || !(await getAffiliateSession(token, context))) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/affiliates/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  // ------------------------------------------------------------------
  // 3. Set affiliate referral cookie when ?ref= is present
  //    60-day window, last-click attribution
  // ------------------------------------------------------------------
  const ref = searchParams.get("ref");
  if (ref && /^[A-Z0-9]{1,16}$/i.test(ref)) {
    const res = NextResponse.next();
    res.cookies.set("awaken_ref", ref.toUpperCase(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 60, // 60 days
      path: "/",
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/affiliates/dashboard/:path*",
    // Match all pages (not static assets) to capture ?ref= on any URL
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)).*)",
  ],
};

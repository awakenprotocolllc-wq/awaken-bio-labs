import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // ------------------------------------------------------------------
  // 1. Protect /admin/* (except /admin/login)
  // ------------------------------------------------------------------
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get("awaken_admin")?.value;
    const expected = process.env.ADMIN_SESSION_TOKEN;

    if (!expected || token !== expected) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  // ------------------------------------------------------------------
  // 2. Protect /affiliates/dashboard/* with real session cookie
  // ------------------------------------------------------------------
  if (pathname.startsWith("/affiliates/dashboard")) {
    const sessionToken = req.cookies.get("awaken_affiliate")?.value;
    if (!sessionToken) {
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import { getCurrentUser, logout, type AffiliateUser } from "@/lib/affiliate-auth";

const nav = [
  { label: "Overview", href: "/affiliates/dashboard", icon: "▦" },
  { label: "Links & Codes", href: "/affiliates/dashboard/links", icon: "↗" },
  { label: "Payouts", href: "/affiliates/dashboard/payouts", icon: "$" },
  { label: "Creatives", href: "/affiliates/dashboard/creatives", icon: "✦" },
  { label: "Settings", href: "/affiliates/dashboard/settings", icon: "⚙" },
];

export default function AffiliateDashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AffiliateUser | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/affiliates/login");
      return;
    }
    setUser(u);
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/affiliates/login");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <p className="font-mono text-bone text-xs tracking-wider">LOADING…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside
        className={`${
          mobileNav ? "block" : "hidden"
        } lg:block fixed lg:sticky inset-0 lg:top-0 lg:h-screen z-40 w-full lg:w-72 bg-carbon border-r border-slate flex-shrink-0 overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate">
          <Link href="/" className="block">
            <Logo compact />
          </Link>
          <button
            className="lg:hidden text-paper h-10 w-10"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="p-5 border-b border-slate">
          <p className="font-mono text-[10px] text-accent tracking-[0.2em] mb-2">
            — SIGNED IN —
          </p>
          <p className="font-sans font-bold text-paper truncate">{user.name}</p>
          <p className="font-mono text-xs text-bone truncate">{user.email}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-obsidian border border-accent/40 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-[10px] text-accent tracking-wider uppercase">
              {user.status}
            </span>
          </div>
        </div>

        <nav className="p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/affiliates/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNav(false)}
                className={`flex items-center gap-3 px-4 h-11 min-h-[44px] font-sans text-sm transition-colors ${
                  active
                    ? "bg-accent text-obsidian font-semibold"
                    : "text-paper hover:bg-obsidian"
                }`}
              >
                <span
                  className={`font-mono text-base ${
                    active ? "text-obsidian" : "text-accent"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate mt-auto">
          <button
            onClick={handleLogout}
            className="w-full border border-slate hover:border-accent text-paper hover:text-accent font-mono text-xs tracking-wider uppercase h-11 min-h-[44px] transition-colors"
          >
            Sign Out
          </button>
          <Link
            href="/"
            className="block text-center font-mono text-[10px] text-bone tracking-wider mt-4 hover:text-accent transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-carbon border-b border-slate sticky top-0 z-30">
          <Logo compact />
          <button
            onClick={() => setMobileNav(true)}
            className="text-paper h-10 w-10 flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <main className="p-5 sm:p-8 lg:p-10 max-w-6xl">
          <div className="mb-8">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-2">
              — AFFILIATE DASHBOARD —
            </p>
            <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1]">
              {title}
            </h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

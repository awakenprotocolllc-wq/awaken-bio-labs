import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { business } from "@/lib/business";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email Preferences · Awaken Bio Labs" };

export default function MarketingConfirmedPage({
  searchParams,
}: {
  searchParams: { ok?: string; blocked?: string; error?: string };
}) {
  const state: "ok" | "blocked" | "error" =
    searchParams.ok === "1" ? "ok" : searchParams.blocked === "1" ? "blocked" : "error";

  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[calc(100vh-200px)] flex items-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="w-16 h-16 border-2 border-accent flex items-center justify-center mx-auto mb-8" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              {state === "ok" ? (
                <path d="M5 13l4 4L19 7" stroke="#57C7D6" strokeWidth="2" strokeLinecap="square" />
              ) : (
                <path d="M4 6h16v12H4z M4 7l8 6 8-6" stroke="#57C7D6" strokeWidth="1.5" fill="none" />
              )}
            </svg>
          </div>

          {state === "ok" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                You&apos;re subscribed.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-10">
                Thanks for confirming — you&apos;ll receive occasional marketing emails from{" "}
                {business.name}. Every email includes a one-click unsubscribe link, and you can
                also change this any time in your account settings.
              </p>
            </>
          )}

          {state === "blocked" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                Your preferences are unchanged.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-10">
                This address has since been unsubscribed or suppressed, so we&apos;ve left that
                in place. If you&apos;d like to receive marketing emails, contact{" "}
                <a href={`mailto:${business.email}`} className="text-accent hover:underline">
                  {business.email}
                </a>.
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                This link didn&apos;t work.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-10">
                The confirmation link appears to be invalid or expired. Your email preferences
                have not changed. You can opt in from your account settings, or contact{" "}
                <a href={`mailto:${business.email}`} className="text-accent hover:underline">
                  {business.email}
                </a>.
              </p>
            </>
          )}

          <Link
            href="/"
            className="inline-flex items-center border border-accent text-accent font-semibold px-8 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
          >
            Return to Site
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

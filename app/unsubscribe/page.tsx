import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { unsubscribeMarketing } from "@/lib/marketing-consent";
import { business } from "@/lib/business";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe · Awaken Bio Labs" };

// Server component: processes the token directly on page load so the opt-out
// takes effect even if the visitor closes the tab immediately. Idempotent.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string; done?: string; error?: string };
}) {
  let state: "success" | "invalid" | "info" = "info";

  if (searchParams.done === "1") {
    state = "success";
  } else if (searchParams.error === "1") {
    state = "invalid";
  } else if (searchParams.token) {
    const verification = verifyUnsubscribeToken(searchParams.token);
    if (verification.valid) {
      await unsubscribeMarketing(verification.email, { source: "link" });
      state = "success";
    } else {
      state = "invalid";
    }
  }

  return (
    <SiteShell>
      <section className="bg-obsidian min-h-[calc(100vh-200px)] flex items-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="w-16 h-16 border-2 border-accent flex items-center justify-center mx-auto mb-8" aria-hidden="true">
            {state === "success" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#57C7D6" strokeWidth="2" strokeLinecap="square" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v12H4z M4 7l8 6 8-6" stroke="#57C7D6" strokeWidth="1.5" fill="none" />
              </svg>
            )}
          </div>

          {state === "success" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                You&apos;ve been unsubscribed.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-6">
                You will no longer receive marketing emails from {business.name}. This took
                effect immediately — no further action is needed.
              </p>
              <p className="text-bone/70 text-sm leading-relaxed mb-10">
                You may still receive transactional emails related to your orders or account,
                such as order confirmations and shipping notifications.
              </p>
            </>
          )}

          {state === "invalid" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                This link didn&apos;t work.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-6">
                The unsubscribe link appears to be invalid or incomplete. Your opt-out has{" "}
                <strong className="text-paper">not</strong> been processed yet.
              </p>
              <p className="text-bone text-sm leading-relaxed mb-10">
                To unsubscribe, email{" "}
                <a
                  href={`mailto:${business.email}?subject=Unsubscribe`}
                  className="text-accent hover:underline"
                >
                  {business.email}
                </a>{" "}
                with the subject &ldquo;Unsubscribe&rdquo; and we will remove you promptly.
              </p>
            </>
          )}

          {state === "info" && (
            <>
              <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-4">
                Manage email preferences.
              </h1>
              <p className="text-bone text-base leading-relaxed mb-10">
                To unsubscribe from marketing emails, use the unsubscribe link at the bottom of
                any marketing email we&apos;ve sent you, or email{" "}
                <a
                  href={`mailto:${business.email}?subject=Unsubscribe`}
                  className="text-accent hover:underline"
                >
                  {business.email}
                </a>{" "}
                with the subject &ldquo;Unsubscribe&rdquo;.
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import SuccessTransition from "@/components/SuccessTransition";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [showTransition, setShowTransition] = useState(false);

  const handleComplete = useCallback(() => router.push("/account"), [router]);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/customer/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setShowTransition(true);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <SiteShell>
      <section className="min-h-[calc(100vh-200px)] bg-obsidian flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          {status === "loading" && (
            <>
              <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— VERIFYING —</p>
              <p className="font-sans text-bone text-sm">Confirming your email address…</p>
            </>
          )}
          {status === "error" && (
            <>
              <p className="font-mono text-red-400 text-xs tracking-[0.25em] mb-4">— LINK INVALID —</p>
              <h1 className="font-sans font-bold text-paper text-2xl mb-4">Verification failed</h1>
              <p className="font-sans text-bone text-sm mb-8">
                This verification link has expired or already been used. You can request a new one from your account.
              </p>
              <a href="/account" className="font-mono text-accent text-sm hover:underline">
                Go to account →
              </a>
            </>
          )}
        </div>
      </section>

      {showTransition && (
        <SuccessTransition label="Email verified" onComplete={handleComplete} />
      )}
    </SiteShell>
  );
}

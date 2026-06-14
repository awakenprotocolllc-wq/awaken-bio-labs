"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error] digest:", error.digest ?? "(no digest)");
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#0a0a0a", color: "#e8e4dc", fontFamily: "monospace" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.625rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#6ee7b7", marginBottom: "1rem" }}>— Error —</p>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, fontFamily: "sans-serif", marginBottom: "1rem" }}>Something went wrong.</h1>
          <p style={{ fontSize: "0.875rem", color: "rgba(232,228,220,0.6)", maxWidth: "24rem", marginBottom: "2.5rem", lineHeight: 1.6 }}>
            An unexpected error occurred. Please try again or contact{" "}
            <a href="mailto:support@awakenbiolabs.com" style={{ color: "#6ee7b7" }}>
              support@awakenbiolabs.com
            </a>{" "}
            if the problem persists.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={reset}
              style={{ border: "1px solid #6ee7b7", color: "#6ee7b7", background: "none", padding: "0 2rem", height: "2.75rem", cursor: "pointer", fontFamily: "monospace", fontSize: "0.75rem", letterSpacing: "0.05em" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ border: "1px solid rgba(232,228,220,0.2)", color: "rgba(232,228,220,0.6)", padding: "0 2rem", height: "2.75rem", display: "inline-flex", alignItems: "center", fontFamily: "monospace", fontSize: "0.75rem", textDecoration: "none", letterSpacing: "0.05em" }}
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

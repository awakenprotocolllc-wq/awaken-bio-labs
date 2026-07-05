"use client";

import { useState } from "react";

export default function ResendEmailButton({ orderId }: { orderId: string }) {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/orders/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.toLowerCase(), email: trimmed }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("sent");
      } else {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-carbon border border-accent/30 px-6 py-5 text-center">
        <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase mb-2">
          ✓ Email Sent
        </p>
        <p className="text-bone text-sm">
          Check your inbox (and spam folder) for your order confirmation and Zelle instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-carbon border border-slate/40 px-6 py-5">
      <p className="font-mono text-bone text-[10px] tracking-[0.2em] uppercase mb-3">
        Didn&apos;t receive your email?
      </p>
      <p className="text-bone/70 text-sm mb-4">
        Enter the email address you used at checkout and we&apos;ll resend your order confirmation and Zelle instructions.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setErrorMsg(""); }}
          placeholder="your@email.com"
          className="flex-1 bg-obsidian border border-slate text-paper font-sans text-sm px-4 h-11 focus:outline-none focus:border-accent placeholder:text-bone/30"
        />
        <button
          onClick={handleResend}
          disabled={status === "loading"}
          className="font-mono text-xs tracking-wider uppercase border border-accent text-accent hover:bg-accent/10 px-5 h-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {status === "loading" ? "Sending…" : "Resend Email"}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p className="font-mono text-red-400 text-[10px] tracking-wider mt-3">✗ {errorMsg}</p>
      )}
    </div>
  );
}

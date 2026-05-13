"use client";

import { useState } from "react";

export default function ContractSigningForm({
  token,
  name,
}: {
  token: string;
  name: string;
}) {
  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please check the box to confirm you agree to the terms.");
      return;
    }
    if (signatureName.trim().length < 2) {
      setError("Please type your full name as your digital signature.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/sign-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signatureName: signatureName.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Something went wrong.");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ background: "#141517", border: "1px solid #57C7D6", padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase", marginBottom: 16 }}>
          — AGREEMENT SIGNED —
        </p>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#F5F3EF" }}>
          Welcome aboard!
        </h2>
        <p style={{ color: "#A09E9A", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Your affiliate account is now active. Your login credentials have been sent to your email address.
          Check your inbox (and spam folder) — you'll receive them within a few minutes.
        </p>
        <p style={{ marginTop: 20, fontFamily: "monospace", fontSize: 11, color: "#5A5856" }}>
          Questions? support@awakenbiolabs.com
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", color: "#57C7D6", textTransform: "uppercase", marginBottom: 20 }}>
        — DIGITAL SIGNATURE —
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", color: "#5A5856", textTransform: "uppercase", marginBottom: 8 }}>
          Type your full name to sign *
        </label>
        <input
          type="text"
          value={signatureName}
          onChange={(e) => setSignatureName(e.target.value)}
          placeholder={name}
          style={{
            width: "100%",
            background: "#141517",
            border: "1px solid #2A2B2F",
            color: "#E8E6E1",
            fontFamily: "monospace",
            fontSize: 16,
            padding: "12px 16px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 24 }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#57C7D6", width: 16, height: 16, flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, color: "#A09E9A", lineHeight: 1.6 }}>
          I have read and agree to the Awaken Bio Labs Affiliate Agreement. I understand that all products are for in-vitro research use only and I will represent them as such in all promotional materials.
        </span>
      </label>

      {error && (
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", padding: "10px 14px", marginBottom: 20 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? "#3a8a96" : "#57C7D6",
          color: "#0A0B0D",
          fontWeight: 700,
          fontSize: 15,
          padding: "16px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "monospace",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {loading ? "Signing…" : "Sign Agreement & Activate Account →"}
      </button>

      <p style={{ marginTop: 12, fontFamily: "monospace", fontSize: 10, color: "#5A5856", textAlign: "center" }}>
        By clicking above you are providing your legally binding digital signature.
      </p>
    </form>
  );
}

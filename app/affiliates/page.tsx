"use client";

import { useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";

const programs = [
  {
    type: "ambassador" as const,
    label: "Ambassador",
    commission: "20%",
    description: "Share your code. Earn 20% commission on every sale you refer. Customers get 10% off.",
    ideal: "Content creators, coaches, practitioners, influencers.",
  },
  {
    type: "licensee" as const,
    label: "Licensee",
    commission: "50%",
    description: "Private label partner program. Earn 50% commission on gross sales using your code. Customers get 10% off.",
    ideal: "Clinics, practitioners, and resellers with established clientele.",
  },
];

const ambassadorBenefits = [
  { title: "20% Per Sale", body: "Paid out twice monthly. No caps, no minimums." },
  { title: "Real-Time Dashboard", body: "Track clicks, conversions, and earnings as they happen." },
  { title: "Unique Tracking Code", body: "Your code gives customers 10% off. 60-day cookie window." },
  { title: "Creative Library", body: "On-brand graphics, copy, and product imagery — ready on day one." },
];

export default function AffiliatesPage() {
  const [programType, setProgramType] = useState<"ambassador" | "licensee">("ambassador");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      platform: fd.get("platform"),
      username: fd.get("username"),
      audience: fd.get("audience"),
      about: fd.get("about"),
      programType,
      website: fd.get("website"), // honeypot — backend rejects if non-empty
    };
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please email affiliates@awakenbiolabs.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="PARTNER PROGRAM"
        title="Grow With Awaken."
        subtitle="Two ways to partner. One mission. Whether you're building an audience or running a practice — we have a program built for you."
      />

      <div className="bg-carbon border-b border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-bone tracking-wider">ALREADY A PARTNER?</p>
          <Link
            href="/affiliates/login"
            className="font-mono text-xs tracking-wider uppercase border border-accent text-accent px-4 h-10 min-h-[44px] inline-flex items-center hover:bg-accent/10 transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </div>

      {/* Program comparison cards */}
      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-8">— CHOOSE YOUR PROGRAM —</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate">
            {programs.map((p) => (
              <div key={p.type} className="bg-carbon p-8 sm:p-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-accent text-[10px] tracking-[0.2em] uppercase mb-1">
                      {p.type === "licensee" ? "— PRIVATE LABEL —" : "— CONTENT & COMMUNITY —"}
                    </p>
                    <h3 className="font-sans font-bold text-paper text-3xl">{p.label}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-accent text-3xl font-bold">{p.commission}</p>
                    <p className="font-mono text-bone text-[10px] tracking-wider">commission</p>
                  </div>
                </div>
                <p className="text-bone text-sm leading-relaxed mb-3">{p.description}</p>
                <p className="font-mono text-bone/50 text-[10px] tracking-wider">{p.ideal}</p>
              </div>
            ))}
          </div>

          {/* Ambassador benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate mt-px">
            {ambassadorBenefits.map((b) => (
              <div key={b.title} className="bg-obsidian p-6">
                <h4 className="font-sans font-bold text-paper text-sm mb-2">{b.title}</h4>
                <p className="text-bone text-xs leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section className="bg-carbon border-t border-slate py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— APPLY —</p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl leading-[1] tracking-tight mb-4">
            Apply to partner with Awaken.
          </h2>
          <p className="text-bone mb-10">
            Approvals typically within 48 hours. We review every application personally.
          </p>

          {submitted ? (
            <div className="bg-obsidian border border-accent p-8">
              <p className="font-mono text-accent text-xs tracking-[0.2em] mb-3">
                — APPLICATION RECEIVED —
              </p>
              <h3 className="font-sans font-bold text-paper text-2xl mb-3">
                Thanks. We&apos;ll be in touch.
              </h3>
              <p className="text-bone">
                Our team reviews every application personally. Expect a response within
                48 hours at the email you provided.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot — hidden from real users, filled by bots */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {/* Program type selector */}
              <div>
                <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-3">
                  Program <span className="text-accent">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {programs.map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => setProgramType(p.type)}
                      className={`text-left border p-4 transition-colors ${
                        programType === p.type
                          ? "border-accent bg-accent/5"
                          : "border-slate hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-bold text-paper text-sm">{p.label}</span>
                        <span className={`font-mono text-sm font-bold ${programType === p.type ? "text-accent" : "text-bone"}`}>
                          {p.commission}
                        </span>
                      </div>
                      <p className="font-mono text-bone text-[10px] leading-relaxed">{p.ideal}</p>
                      {programType === p.type && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span className="font-mono text-accent text-[10px] tracking-wider">SELECTED</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Full Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field
                label={programType === "licensee" ? "Practice / Business URL or Location" : "Primary Platform URL (Instagram, YouTube, Site)"}
                name="platform"
                required
              />
              <Field
                label="Username / Handle"
                name="username"
                placeholder="@yourusername"
              />
              <Field
                label={programType === "licensee" ? "Monthly Patient / Client Volume (approx.)" : "Audience Size (approx.)"}
                name="audience"
              />
              <div>
                <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                  {programType === "licensee"
                    ? "Tell us about your practice and client base"
                    : "Tell us about your audience"}
                </label>
                <textarea
                  name="about"
                  rows={5}
                  className="w-full bg-obsidian border border-slate text-paper font-sans px-4 py-3 focus:border-accent focus:outline-none transition-colors resize-none"
                  placeholder={
                    programType === "licensee"
                      ? "Specialty, client demographics, how you'd integrate Awaken products…"
                      : "Niche, demographics, why you're a fit for Awaken…"
                  }
                />
              </div>

              {error && (
                <p className="font-mono text-[11px] text-red-400 tracking-wide">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-obsidian font-semibold px-8 h-12 min-h-[44px] inline-flex items-center hover:bg-accent/80 transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : `Apply as ${programType === "licensee" ? "Licensee" : "Ambassador"}`}
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function Field({
  label, name, type = "text", required, placeholder,
}: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
      />
    </div>
  );
}

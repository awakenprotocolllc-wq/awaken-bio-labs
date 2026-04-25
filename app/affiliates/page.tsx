"use client";

import { useState } from "react";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";

const benefits = [
  {
    title: "Industry-Leading Commissions",
    body: "Up to 25% per sale, paid out twice monthly. No caps. No tiered nonsense.",
  },
  {
    title: "Real-Time Dashboard",
    body: "Your own portal. Track clicks, conversions, and earnings as they happen.",
  },
  {
    title: "Unique Tracking Links",
    body: "Custom links and discount codes per affiliate. Cookie window is 60 days.",
  },
  {
    title: "Creative Library",
    body: "On-brand graphics, copy, and product imagery — ready to deploy on day one.",
  },
];

export default function AffiliatesPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="PARTNER PROGRAM"
        title="Grow With Awaken."
        subtitle="If you have an audience that takes their training, recovery, or longevity seriously — we want to work with you. Built to run automatically once you're approved."
      />

      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate">
          {benefits.map((b) => (
            <div key={b.title} className="bg-carbon p-6 sm:p-8">
              <h3 className="font-sans font-bold text-paper text-lg mb-3">{b.title}</h3>
              <p className="text-bone leading-relaxed text-sm">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-carbon border-t border-slate py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — APPLY —
          </p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl leading-[1] tracking-tight mb-4">
            Apply to become an affiliate.
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
                Thanks. We'll be in touch.
              </h3>
              <p className="text-bone">
                Our team reviews every application personally. Expect a response within
                48 hours at the email you provided.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-5"
            >
              <Field label="Full Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Primary Platform URL (Instagram, YouTube, Site)" name="platform" required />
              <Field label="Audience Size (approx.)" name="audience" />
              <div>
                <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                  Tell us about your audience
                </label>
                <textarea
                  name="about"
                  rows={5}
                  className="w-full bg-obsidian border border-slate text-paper font-sans px-4 py-3 focus:border-accent focus:outline-none transition-colors resize-none"
                  placeholder="Niche, demographics, why you're a fit for Awaken…"
                />
              </div>
              <button
                type="submit"
                className="bg-accent text-obsidian font-semibold px-8 h-12 min-h-[44px] inline-flex items-center hover:bg-accent/80 transition-colors"
              >
                Submit Application
              </button>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
      />
    </div>
  );
}

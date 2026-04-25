"use client";

import { useState } from "react";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";

const faqs = [
  {
    q: "Are your products for human consumption?",
    a: "No. All Awaken Bio Labs products are sold strictly for in-vitro research and laboratory experimentation. They are not intended for human or animal consumption.",
  },
  {
    q: "How fast do orders ship?",
    a: "Orders placed before 1PM Eastern ship same day via FedEx 2-Day. Orders after 1PM ship the following business day. Cold-chain handling is applied where required.",
  },
  {
    q: "Where can I find Certificates of Analysis?",
    a: "Every product has a public COA available on our COAs page. Batch-specific COAs matching your order can be requested by emailing support with your order number.",
  },
  {
    q: "Do you ship internationally?",
    a: "We currently ship within the United States only. International availability may expand — subscribe to be notified.",
  },
  {
    q: "What's your return policy?",
    a: "Due to the nature of research compounds, we do not accept returns of opened product. Damaged or incorrect shipments are replaced free of charge — contact us within 7 days of delivery.",
  },
  {
    q: "How do I become an affiliate?",
    a: "Apply via the Affiliates page. We review applications personally and typically respond within 48 hours.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <SiteShell>
      <PageHeader
        eyebrow="GET IN TOUCH"
        title="Talk to a specialist."
        subtitle="Questions about a compound, a protocol, an order, or wholesale? We respond to every message within one business day."
      />

      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Contact info */}
          <div className="lg:col-span-1 space-y-8">
            <ContactBlock
              eyebrow="Email"
              value="support@awakenbiolabs.com"
              detail="Response within 24 hours, M–F"
            />
            <ContactBlock
              eyebrow="Wholesale"
              value="wholesale@awakenbiolabs.com"
              detail="Bulk pricing, private labeling, distribution"
            />
            <ContactBlock
              eyebrow="Affiliates"
              value="affiliates@awakenbiolabs.com"
              detail="Partnership inquiries"
            />
            <ContactBlock
              eyebrow="Hours"
              value="Mon – Fri · 9am – 6pm ET"
              detail="Closed weekends and US holidays"
            />
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-carbon border border-accent p-8">
                <p className="font-mono text-accent text-xs tracking-[0.2em] mb-3">
                  — MESSAGE SENT —
                </p>
                <h3 className="font-sans font-bold text-paper text-2xl mb-3">
                  Got it. We'll get back to you.
                </h3>
                <p className="text-bone">
                  A team member will respond to your inquiry within one business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="bg-carbon border border-slate p-6 sm:p-8 space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Name" name="name" required />
                  <Field label="Email" name="email" type="email" required />
                </div>
                <div>
                  <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                    Reason <span className="text-accent">*</span>
                  </label>
                  <select
                    name="reason"
                    required
                    className="w-full bg-obsidian border border-slate text-paper font-sans px-4 h-12 min-h-[44px] focus:border-accent focus:outline-none transition-colors"
                  >
                    <option>Product question</option>
                    <option>Order issue</option>
                    <option>Wholesale inquiry</option>
                    <option>Protocol guidance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-bone tracking-wider uppercase mb-2">
                    Message <span className="text-accent">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={6}
                    required
                    className="w-full bg-obsidian border border-slate text-paper font-sans px-4 py-3 focus:border-accent focus:outline-none transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-accent text-obsidian font-semibold px-8 h-12 min-h-[44px] inline-flex items-center hover:bg-accent/80 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-carbon border-t border-slate py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— FAQ —</p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl leading-[1] tracking-tight mb-12">
            Frequently asked.
          </h2>
          <div className="border-t border-slate">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-slate">
                <summary className="flex items-center justify-between cursor-pointer py-6 list-none min-h-[44px]">
                  <span className="font-sans font-medium text-paper text-lg pr-4">
                    {f.q}
                  </span>
                  <span className="font-mono text-accent text-2xl leading-none ml-4 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="text-bone pb-6 leading-relaxed max-w-3xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function ContactBlock({
  eyebrow,
  value,
  detail,
}: {
  eyebrow: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l-2 border-accent pl-5">
      <p className="font-mono text-accent text-[10px] tracking-[0.25em] uppercase mb-2">
        {eyebrow}
      </p>
      <p className="font-sans font-medium text-paper text-lg break-all">{value}</p>
      <p className="font-mono text-bone text-xs mt-1">{detail}</p>
    </div>
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

"use client";

import { useId, useState } from "react";

type Section = { heading: string; faqs: { q: string; a: string }[] };

export default function FAQAccordion({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <section key={section.heading} aria-labelledby={`faq-section-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}>
          <h2
            id={`faq-section-${section.heading.replace(/\s+/g, "-").toLowerCase()}`}
            className="font-mono text-accent text-xs tracking-[0.25em] mb-4 uppercase"
          >
            — {section.heading} —
          </h2>
          <div className="border-t border-slate">
            {section.faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelId = `faq-panel-${id}`;
  const triggerId = `faq-trigger-${id}`;

  return (
    <div className="border-b border-slate">
      <h3>
        <button
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left py-6 px-1 min-h-[44px]"
        >
          <span className="font-sans font-medium text-paper text-base sm:text-lg pr-4">{q}</span>
          <span
            aria-hidden="true"
            className="font-mono text-accent text-2xl leading-none ml-4 shrink-0 transition-transform duration-200"
            style={{ transform: open ? "rotate(45deg)" : "none" }}
          >
            +
          </span>
        </button>
      </h3>
      {/* CSS grid-rows: GPU-composited expand with no layout reflow */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="text-bone pb-6 px-1 leading-relaxed max-w-3xl">{a}</p>
        </div>
      </div>
    </div>
  );
}

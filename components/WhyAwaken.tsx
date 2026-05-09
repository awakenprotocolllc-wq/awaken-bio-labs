"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const items = [
  {
    title: "Made in the USA",
    body:
      "Every compound we carry is manufactured domestically — not sourced overseas. US-based production means tighter quality control, shorter supply chains, and full visibility into what goes into every research vial.",
  },
  {
    title: "Tested in the USA",
    body:
      "Third-party testing is completed right here in the US by independent, accredited laboratories. We don't send samples abroad for analysis. Every Certificate of Analysis is issued by a domestic lab you can verify.",
  },
  {
    title: "99%+ Purity, HPLC-Confirmed",
    body:
      "Every batch independently tested by a US third-party laboratory. Certificate of Analysis available for every product. No guessing, no black boxes.",
  },
  {
    title: "Fast Reliable Fulfillment",
    body:
      "Orders placed before 1PM ship same day via FedEx 2-Day. Cold chain handling where required. All products ship for in-vitro research use only.",
  },
  {
    title: "Built For Serious Researchers",
    body:
      "No gimmicks. No fillers. No compromises. Just the compounds serious research demands at the purity laboratories require — at prices that don't penalize you for buying American.",
  },
];

export default function WhyAwaken() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-carbon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
        <div className="lg:col-span-2">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">— WHY US —</p>
          <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl leading-[1] tracking-tight">
            Leaders In Precision.
          </h2>
          <p className="text-bone mt-5 text-base sm:text-lg max-w-md">
            Serious researchers choose serious suppliers.
          </p>
        </div>

        <div className="lg:col-span-3 border-t border-slate">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.title} className="border-b border-slate">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left py-6 px-1 min-h-[44px] transition-colors"
                >
                  <span className="font-sans font-medium text-paper text-lg sm:text-xl">
                    {item.title}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-accent text-2xl leading-none ml-4 shrink-0"
                  >
                    +
                  </motion.span>
                </button>
                {/* CSS grid-rows trick: GPU-composited, no layout reflow */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="text-bone pb-6 px-1 max-w-2xl leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

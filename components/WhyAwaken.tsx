"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const items = [
  {
    title: "Verified Purity",
    body:
      "Every batch independently tested by a US third-party laboratory. Certificate of Analysis available for every product.",
  },
  {
    title: "Research-Grade Manufacturing",
    body:
      "Manufactured under strict GMP standard facilities. Consistent, reliable, uncompromising.",
  },
  {
    title: "Full COA Transparency",
    body:
      "Every product ships with its own Certificate of Analysis. No black boxes. No guessing.",
  },
  {
    title: "Fast Reliable Fulfillment",
    body:
      "Orders placed before 1PM ship same day via FedEx 2-Day. Cold chain handling where required.",
  },
  {
    title: "Built For Serious Researchers",
    body:
      "No gimmicks. No fillers. No compromises. Just the compounds you need at the purity you demand.",
  },
];

export default function WhyAwaken() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-carbon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
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
                  className={`w-full flex items-center justify-between text-left py-6 px-1 min-h-[44px] transition-colors ${
                    isOpen ? "bg-carbon" : ""
                  }`}
                >
                  <span
                    className={`font-sans font-medium text-lg sm:text-xl ${
                      isOpen ? "text-paper" : "text-paper"
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="font-mono text-accent text-2xl leading-none ml-4">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-bone pb-6 px-1 max-w-2xl leading-relaxed">
                        {item.body}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

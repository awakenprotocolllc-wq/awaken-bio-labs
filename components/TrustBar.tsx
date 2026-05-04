"use client";

import { motion } from "framer-motion";

const items = [
  {
    label: "Made in the USA",
    sub: "Domestic Manufacturing Only",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18v12H3z" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M3 6h7v5H3z" fill="#57C7D6" fillOpacity="0.2" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M5 8h1m2 0h1M5 10h1m2 0h1" stroke="#57C7D6" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Third-Party Tested in the USA",
    sub: "Independent US Lab Every Batch",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M9 12l2 2 4-4" stroke="#57C7D6" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    ),
  },
  {
    label: "99%+ Purity",
    sub: "Every Batch Certified",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M8 2h8l-1 6a4 4 0 0 1 1 2.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9.5A4 4 0 0 1 9 8L8 2z" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M9 14h6" stroke="#57C7D6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "COA Verified",
    sub: "Full Transparency Every Product",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l5 5v13H6z" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M15 3v5h5" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M9 13h6M9 17h6" stroke="#57C7D6" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function TrustBar() {
  return (
    <section className="bg-carbon border-t border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-y-8">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`flex flex-col items-center text-center px-4 ${
              i < items.length - 1 ? "md:border-r md:border-slate" : ""
            }`}
          >
            <div className="mb-3">{it.icon}</div>
            <div className="font-sans font-medium text-paper text-sm sm:text-base">
              {it.label}
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-bone mt-1 tracking-wide uppercase">
              {it.sub}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

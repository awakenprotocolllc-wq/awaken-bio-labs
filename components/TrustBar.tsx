"use client";

import { motion } from "framer-motion";

const items = [
  {
    label: "Third-Party Tested",
    sub: "US Laboratory Verified",
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
    label: "FedEx 2-Day Shipping",
    sub: "Order Before 1PM Ships Today",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="13" height="10" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M15 10h4l3 3v4h-7" stroke="#57C7D6" strokeWidth="1.5" />
        <circle cx="7" cy="19" r="2" stroke="#57C7D6" strokeWidth="1.5" />
        <circle cx="17" cy="19" r="2" stroke="#57C7D6" strokeWidth="1.5" />
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

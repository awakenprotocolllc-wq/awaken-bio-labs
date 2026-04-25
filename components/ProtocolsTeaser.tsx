"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Peptide Protocol",
    body: "Clinically structured compound cycles built for real results.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <path d="M8 2h8v5l-2 3v9a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-9L8 7V2z" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M8 2h8" stroke="#57C7D6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Nutrition Plan",
    body: "Precision meal planning designed to amplify your protocol.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" stroke="#57C7D6" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Training Program",
    body: "Elite programming from coaches who actually use the science.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="10" width="2.5" height="4" stroke="#57C7D6" strokeWidth="1.5" />
        <rect x="19.5" y="10" width="2.5" height="4" stroke="#57C7D6" strokeWidth="1.5" />
        <rect x="5" y="7" width="3" height="10" stroke="#57C7D6" strokeWidth="1.5" />
        <rect x="16" y="7" width="3" height="10" stroke="#57C7D6" strokeWidth="1.5" />
        <path d="M8 12h8" stroke="#57C7D6" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function ProtocolsTeaser() {
  return (
    <section id="protocols" className="bg-obsidian py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
          — EXCLUSIVE ACCESS —
        </p>
        <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl leading-[1] tracking-tight">
          The Awaken Protocol
        </h2>
        <p className="text-bone mt-5 max-w-2xl mx-auto text-base sm:text-lg">
          Full peptide protocols, precision meal plans, and elite training programming.
          Included with every order.
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-carbon border-t-4 border-accent border-x border-b border-x-slate border-b-slate p-8 text-left"
            >
              <div className="mb-5">{c.icon}</div>
              <h3 className="font-sans font-bold text-paper text-xl sm:text-2xl mb-3">
                {c.title}
              </h3>
              <p className="text-bone leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-14">
          <a
            href="/protocols"
            className="inline-flex items-center border border-accent text-accent font-semibold px-7 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
          >
            Learn More About Protocols
          </a>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const cards = [
  {
    eyebrow: "Researchers",
    title: "For Researchers",
    body: "Browse research-grade compounds by category, size, and availability.",
    cta: "Browse Compounds",
    href: "/shop",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
        <path d="M8 2h8l-1 6a4 4 0 0 1 1 2.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9.5A4 4 0 0 1 9 8L8 2z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    eyebrow: "Verification",
    title: "For Verification",
    body: "Review available third-party testing and COA documentation before purchasing.",
    cta: "View COAs",
    href: "/coas",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
        <path d="M6 3h9l5 5v13H6z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    eyebrow: "Partners",
    title: "For Partners",
    body: "Explore partner and affiliate opportunities with tracked links and commission reporting.",
    cta: "Partner With Us",
    href: "/affiliates",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    ),
  },
];

export default function HeroPathCards() {
  return (
    <section className="bg-carbon border-t border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-slate">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="bg-carbon p-8 flex flex-col gap-5 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-accent/30 flex items-center justify-center bg-accent/5 shrink-0">
                {card.icon}
              </div>
              <p className="font-mono text-accent text-[10px] tracking-[0.25em] uppercase">
                — {card.eyebrow} —
              </p>
            </div>
            <div>
              <h3 className="font-sans font-bold text-paper text-xl mb-2">{card.title}</h3>
              <p className="font-sans text-bone text-sm leading-relaxed">{card.body}</p>
            </div>
            <Link
              href={card.href}
              className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-accent uppercase mt-auto group-hover:gap-3 transition-all"
            >
              {card.cta}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

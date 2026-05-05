"use client";

import { motion } from "framer-motion";

const lines = [
  { text: "PEPTIDE", className: "text-paper" },
  { text: "SCIENCE.", className: "text-paper" },
  { text: "IN-VITRO", className: "text-accent" },
  { text: "PRECISION.", className: "text-stroke-accent" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-96px)] bg-obsidian overflow-hidden grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-8 items-center">
        {/* Left 60% */}
        <div className="lg:col-span-3">
          <h1 className="font-sans font-bold leading-[0.88] tracking-tight text-[clamp(2.75rem,11vw,9rem)]">
            {lines.map((line, i) => (
              <motion.span
                key={line.text}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`block ${line.className}`}
              >
                {line.text}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-8 max-w-xl text-bone font-sans font-light text-base sm:text-lg"
          >
            Research-grade peptide compounds for in-vitro laboratory use. Made in the USA. Tested in the USA. Not for human or veterinary use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="mt-4 flex items-center gap-2"
          >
            <span className="text-lg">🇺🇸</span>
            <span className="font-mono text-[11px] text-accent tracking-[0.2em] uppercase">
              Domestic Manufacturing · US Lab Verified
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3 sm:gap-4"
          >
            <a
              href="/shop"
              className="inline-flex items-center justify-center bg-accent text-obsidian font-semibold px-6 sm:px-7 h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
            >
              Shop Products
            </a>
            <a
              href="/coas"
              className="inline-flex items-center justify-center border border-accent text-accent font-semibold px-6 sm:px-7 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
            >
              View COAs
            </a>
          </motion.div>
        </div>

        {/* Right 40% — vial visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="lg:col-span-2 relative h-[260px] sm:h-[380px] lg:h-[520px] w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-carbon to-obsidian border border-slate overflow-hidden">
            {/* Glow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[90%] h-[50%] blur-3xl opacity-40 rounded-full"
              style={{ background: "radial-gradient(ellipse at center, #57C7D6 0%, transparent 70%)" }}
            />
            {/* Molecular lines background */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 520" fill="none">
              <circle cx="200" cy="260" r="120" stroke="#57C7D6" strokeWidth="0.5" strokeDasharray="4 6" />
              <circle cx="200" cy="260" r="80" stroke="#57C7D6" strokeWidth="0.5" strokeDasharray="2 8" />
              <line x1="80" y1="140" x2="200" y2="260" stroke="#57C7D6" strokeWidth="0.5" />
              <line x1="320" y1="140" x2="200" y2="260" stroke="#57C7D6" strokeWidth="0.5" />
              <line x1="80" y1="380" x2="200" y2="260" stroke="#57C7D6" strokeWidth="0.5" />
              <line x1="320" y1="380" x2="200" y2="260" stroke="#57C7D6" strokeWidth="0.5" />
              <circle cx="80" cy="140" r="4" fill="#57C7D6" />
              <circle cx="320" cy="140" r="4" fill="#57C7D6" />
              <circle cx="80" cy="380" r="4" fill="#57C7D6" />
              <circle cx="320" cy="380" r="4" fill="#57C7D6" />
              <circle cx="200" cy="260" r="6" fill="#57C7D6" />
            </svg>
            {/* Vial */}
            <svg className="absolute inset-0 m-auto h-[78%] w-auto" viewBox="0 0 120 320" fill="none">
              <defs>
                <linearGradient id="vialGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1a1c20" />
                  <stop offset="100%" stopColor="#57C7D6" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2A2D33" />
                  <stop offset="100%" stopColor="#1a1c20" />
                </linearGradient>
              </defs>
              {/* Cap */}
              <rect x="44" y="8" width="32" height="16" rx="2" fill="url(#capGrad)" stroke="#3a3d45" strokeWidth="1" />
              {/* Crimp ring */}
              <rect x="40" y="24" width="40" height="8" fill="#2A2D33" stroke="#3a3d45" strokeWidth="0.5" />
              {/* Body */}
              <path d="M42 32 L42 278 Q42 294 60 294 Q78 294 78 278 L78 32 Z" fill="url(#vialGrad)" stroke="#3a3d45" strokeWidth="1" />
              {/* Label band */}
              <rect x="42" y="110" width="36" height="90" fill="#1e2024" stroke="#3a3d45" strokeWidth="0.5" />
              {/* Label content */}
              <text x="60" y="132" textAnchor="middle" fill="#57C7D6" fontSize="7" fontFamily="monospace" letterSpacing="2" fontWeight="bold">AWAKEN</text>
              <text x="60" y="144" textAnchor="middle" fill="#57C7D6" fontSize="4.5" fontFamily="monospace" letterSpacing="1">BIO LABS</text>
              <line x1="46" y1="150" x2="74" y2="150" stroke="#3a3d45" strokeWidth="0.5" />
              <text x="60" y="162" textAnchor="middle" fill="#D9D9DC" fontSize="5.5" fontFamily="monospace" letterSpacing="1">LYOPHILIZED</text>
              <text x="60" y="174" textAnchor="middle" fill="#D9D9DC" fontSize="5" fontFamily="monospace" letterSpacing="0.5">PURITY ≥ 99%</text>
              <line x1="46" y1="180" x2="74" y2="180" stroke="#3a3d45" strokeWidth="0.5" />
              <text x="60" y="192" textAnchor="middle" fill="#57C7D6" fontSize="4.5" fontFamily="monospace" letterSpacing="1">🇺🇸 MFG IN USA</text>
              {/* Liquid fill glow at bottom */}
              <path d="M43 240 L43 278 Q43 293 60 293 Q77 293 77 278 L77 240 Z" fill="#57C7D6" fillOpacity="0.08" />
              {/* Shine */}
              <line x1="48" y1="36" x2="48" y2="260" stroke="white" strokeWidth="0.5" strokeOpacity="0.06" />
            </svg>
            {/* USA badge */}
            <div className="absolute top-4 right-4 bg-carbon border border-accent/40 px-3 py-1.5">
              <p className="font-mono text-[9px] text-accent tracking-[0.2em]">MADE & TESTED</p>
              <p className="font-mono text-[9px] text-accent tracking-[0.2em]">IN THE USA 🇺🇸</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

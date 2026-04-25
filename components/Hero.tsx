"use client";

import { motion } from "framer-motion";

const lines = [
  { text: "PEPTIDE", className: "text-paper" },
  { text: "SCIENCE.", className: "text-paper" },
  { text: "HUMAN", className: "text-accent" },
  { text: "POTENTIAL.", className: "text-stroke-accent" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-96px)] bg-obsidian overflow-hidden grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 items-center">
        {/* Left 60% */}
        <div className="lg:col-span-3">
          <h1 className="font-sans font-bold leading-[0.88] tracking-tight text-[clamp(3rem,11vw,9rem)]">
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
            62 research compounds. Verified purity. Built for serious work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href="/shop"
              className="inline-flex items-center justify-center bg-accent text-obsidian font-semibold px-7 h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
            >
              Shop Products
            </a>
            <a
              href="/protocols"
              className="inline-flex items-center justify-center border border-accent text-accent font-semibold px-7 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
            >
              View Protocols
            </a>
          </motion.div>
        </div>

        {/* Right 40% — vial placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="lg:col-span-2 relative h-[320px] sm:h-[420px] lg:h-[520px] w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-carbon to-obsidian border border-slate overflow-hidden">
            {/* Bottom accent glow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[80%] h-[40%] blur-3xl opacity-60 rounded-full"
              style={{
                background: "radial-gradient(ellipse at center, #57C7D6 0%, transparent 70%)",
              }}
            />
            {/* Vial silhouette */}
            <svg
              className="absolute inset-0 m-auto h-[70%] w-auto"
              viewBox="0 0 120 300"
              fill="none"
            >
              <rect x="45" y="10" width="30" height="14" stroke="#2A2D33" strokeWidth="1.5" />
              <rect x="40" y="24" width="40" height="10" fill="#2A2D33" />
              <path
                d="M42 34 L42 270 Q42 285 60 285 Q78 285 78 270 L78 34 Z"
                stroke="#2A2D33"
                strokeWidth="1.5"
                fill="url(#vialGrad)"
              />
              <defs>
                <linearGradient id="vialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#141518" />
                  <stop offset="100%" stopColor="#57C7D6" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <text
                x="60"
                y="160"
                textAnchor="middle"
                fill="#57C7D6"
                fontSize="9"
                fontFamily="monospace"
                letterSpacing="2"
              >
                AWAKEN
              </text>
              <text
                x="60"
                y="175"
                textAnchor="middle"
                fill="#D9D9DC"
                fontSize="6"
                fontFamily="monospace"
                letterSpacing="1"
              >
                10mg · LYOPHILIZED
              </text>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

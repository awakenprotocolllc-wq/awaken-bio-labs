"use client";

import Image from "next/image";
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
        {/* Left — headline + CTAs */}
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

        {/* Right — hero image with branded glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="lg:col-span-2 relative flex items-center justify-center"
        >
          {/* Branded glow — sits behind the image */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(87,199,214,0.22) 0%, rgba(87,199,214,0.06) 50%, transparent 75%)",
              filter: "blur(24px)",
            }}
          />

          {/* Image */}
          <div className="relative w-full">
            <Image
              src="/Hero-Image.png"
              alt="Awaken Bio Labs research peptide compounds"
              width={1672}
              height={941}
              priority
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </div>

          {/* USA badge */}
          <div className="absolute top-0 right-0 bg-carbon border border-accent/40 px-3 py-1.5">
            <p className="font-mono text-[9px] text-accent tracking-[0.2em]">MADE & TESTED</p>
            <p className="font-mono text-[9px] text-accent tracking-[0.2em]">IN THE USA 🇺🇸</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

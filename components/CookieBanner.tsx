"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KEY = "awaken_cookie_consent";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (!v) {
      // small delay so it doesn't compete with the age gate
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function set(value: "accepted" | "declined") {
    localStorage.setItem(KEY, JSON.stringify({ value, at: Date.now() }));
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-[90] bg-carbon border-t border-slate"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <p className="text-bone text-sm leading-relaxed flex-1">
              We use cookies to remember your cart, understand site traffic, and
              improve your experience.{" "}
              <a href="/privacy" className="text-accent hover:underline">
                Read our Privacy Policy.
              </a>
            </p>
            <div className="flex gap-3 w-full lg:w-auto flex-shrink-0">
              <button
                onClick={() => set("declined")}
                className="flex-1 lg:flex-none border border-slate hover:border-accent text-paper hover:text-accent font-mono text-xs tracking-wider uppercase h-11 min-h-[44px] px-5 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => set("accepted")}
                className="flex-1 lg:flex-none bg-accent text-obsidian font-mono text-xs tracking-wider uppercase font-semibold h-11 min-h-[44px] px-5 hover:bg-accent/80 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const KEY = "awaken_age_verified";

export default function AgeGate() {
  const [show, setShow] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (!v) setShow(true);
  }, []);

  function confirm() {
    localStorage.setItem(KEY, JSON.stringify({ verified: true, at: Date.now() }));
    setShow(false);
  }

  function deny() {
    setDenied(true);
  }

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-obsidian/95 backdrop-blur-md flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-carbon border border-slate max-w-lg w-full p-8 sm:p-10"
        >
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {denied ? (
            <div className="text-center">
              <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
                — ACCESS DENIED —
              </p>
              <h2 className="font-sans font-bold text-paper text-2xl mb-4">
                You must be 21+ to enter.
              </h2>
              <p className="text-bone leading-relaxed">
                This website provides research compounds intended for licensed
                researchers. Please return when you meet the age requirement.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4 text-center">
                — AGE VERIFICATION —
              </p>
              <h2
                id="age-gate-title"
                className="font-sans font-bold text-paper text-2xl sm:text-3xl mb-4 text-center leading-tight"
              >
                Are you 21 or older?
              </h2>
              <p className="text-bone leading-relaxed mb-8 text-center text-sm">
                All products on this website are intended for{" "}
                <strong className="text-paper">research use only</strong>. By
                entering, you confirm you are at least 21 years of age and
                acknowledge that products are not for human consumption.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={deny}
                  className="border border-slate hover:border-accent text-paper hover:text-accent font-mono text-xs tracking-wider uppercase h-12 min-h-[44px] transition-colors"
                >
                  No, exit
                </button>
                <button
                  onClick={confirm}
                  className="bg-accent text-obsidian font-semibold h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
                >
                  Yes, I&apos;m 21+
                </button>
              </div>

              <p className="font-mono text-[10px] text-bone tracking-wide text-center mt-6 leading-relaxed">
                By clicking &quot;Yes, I&apos;m 21+&quot; you agree to our{" "}
                <a href="/terms" className="text-accent hover:underline">Terms</a>
                {" "}and{" "}
                <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

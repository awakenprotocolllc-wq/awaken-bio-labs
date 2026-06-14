"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Text shown below the checkmark. Defaults to "Done" */
  label?: string;
  /** Called once the exit animation finishes — navigate or advance step here */
  onComplete: () => void;
  /** Total visible duration before the exit begins, in ms. Defaults to 1100 */
  holdMs?: number;
}

/**
 * Full-screen overlay that plays a circle-draw → checkmark animation,
 * then calls onComplete so the caller can route to the next page/step.
 *
 * Usage:
 *   const [showSuccess, setShowSuccess] = useState(false);
 *   // on API success:
 *   setShowSuccess(true);
 *   ...
 *   {showSuccess && (
 *     <SuccessTransition label="Order placed" onComplete={() => router.push("/order-confirmation")} />
 *   )}
 */
export default function SuccessTransition({ label = "Done", onComplete, holdMs = 1100 }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const holdTimer = setTimeout(() => setExiting(true), holdMs);
    // exit animation is 280ms; fire callback after it finishes
    const doneTimer = setTimeout(() => onComplete(), holdMs + 300);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [holdMs, onComplete]);

  return (
    <div
      aria-live="polite"
      aria-label={label}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-obsidian/95 backdrop-blur-sm ${
        exiting ? "success-overlay-out" : "success-overlay-in"
      }`}
    >
      {/* Animated icon */}
      <div className="success-icon">
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ring — draws in first */}
          <circle
            className="success-circle"
            cx="36"
            cy="36"
            r="22"
            stroke="#4ade80"
            strokeWidth="1.5"
            strokeLinecap="square"
            transform="rotate(-90 36 36)"
          />
          {/* Check — draws in after ring */}
          <path
            className="success-check"
            d="M24 37L32 45L48 28"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* Label */}
      <p className="success-label font-mono text-[11px] tracking-[0.25em] uppercase text-green-400/80">
        {label}
      </p>
    </div>
  );
}

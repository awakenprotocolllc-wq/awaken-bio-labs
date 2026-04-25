"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "COAs", href: "/coas" },
  { label: "Affiliates", href: "/affiliates" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-md transition-colors duration-200 ${
        scrolled
          ? "bg-carbon/90 border-b border-slate"
          : "bg-obsidian/70 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
        <a href="#" className="flex-shrink-0" aria-label="Awaken Bio Labs home">
          <Logo compact />
        </a>

        {/* Desktop links */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="nav-link font-sans text-sm text-paper hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cart icon */}
          <button
            aria-label="Cart"
            className="text-paper hover:text-accent transition-colors h-11 w-11 flex items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
              <circle cx="10" cy="21" r="1.3" fill="currentColor" />
              <circle cx="17" cy="21" r="1.3" fill="currentColor" />
            </svg>
          </button>

          <a
            href="/shop"
            className="hidden sm:inline-flex items-center bg-accent text-obsidian font-sans font-semibold text-sm px-5 h-11 hover:bg-accent/80 transition-colors"
          >
            Shop Now
          </a>

          {/* Hamburger */}
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="lg:hidden text-paper h-11 w-11 flex items-center justify-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile full-screen nav */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[60] bg-obsidian flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate">
              <Logo compact />
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-paper h-11 w-11 flex items-center justify-center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col px-6 py-8 gap-2">
              {links.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="text-paper font-sans text-3xl font-bold py-3 border-b border-slate"
                >
                  {l.label}
                </motion.a>
              ))}
              <a
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-8 bg-accent text-obsidian font-semibold px-6 py-4 text-center hover:bg-accent/80 transition-colors"
              >
                Shop Now
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

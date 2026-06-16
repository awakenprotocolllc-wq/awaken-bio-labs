"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { useCart } from "@/lib/cart";

const links = [
  { label: "Shop", href: "/shop" },
  { label: "COAs", href: "/coas" },
  { label: "About", href: "/about" },
  { label: "Affiliates", href: "/affiliates" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { totalItems, openDrawer } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close mobile menu on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-[100] w-full transition-colors duration-200 ${
          scrolled
            ? "bg-carbon/95 border-b border-slate"
            : "bg-obsidian/80 border-b border-transparent"
        }`}
        style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
          {/* Logo — goes home */}
          <a href="/" className="flex-shrink-0" aria-label="Awaken Bio Labs home">
            <Logo compact />
          </a>

          {/* Desktop links */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className="nav-link font-sans text-sm text-paper hover:text-paper"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Account icon */}
            <a
              href="/account"
              aria-label="My account"
              className="text-paper hover:text-accent transition-colors h-11 w-11 flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              </svg>
            </a>

            {/* Cart icon with badge */}
            <button
              aria-label="Open cart"
              onClick={openDrawer}
              className="relative text-paper hover:text-accent transition-colors h-11 w-11 flex items-center justify-center"
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
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-0.5 bg-accent text-obsidian font-mono font-bold text-[9px] rounded-full flex items-center justify-center leading-none">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            <a
              href="/shop"
              className="hidden sm:inline-flex items-center bg-accent text-obsidian font-sans font-semibold text-sm px-5 h-11 hover:bg-accent/80 transition-colors"
            >
              Shop Now
            </a>

            {/* Hamburger */}
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen(!open)}
              className="lg:hidden text-paper h-11 w-11 flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/*
        Mobile full-screen nav rendered as a SIBLING to <header>, not a child.
        This avoids the backdrop-filter stacking context trap that prevents
        position:fixed children from covering the full viewport.
      */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-obsidian flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate">
              <a href="/" onClick={() => setOpen(false)} aria-label="Awaken Bio Labs home">
                <Logo compact />
              </a>
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
            <nav aria-label="Mobile navigation" className="flex flex-col px-5 py-6 gap-2 overflow-y-auto">
              {links.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="text-paper font-sans text-2xl font-bold py-4 px-4 border border-accent/20 bg-accent/[0.04] hover:bg-accent/10 hover:border-accent/50 transition-colors"
                >
                  {l.label}
                </motion.a>
              ))}

              <div className="mt-4 flex flex-col gap-3">
                <a
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center text-paper font-sans text-xl font-bold py-4 px-4 border border-accent/30 bg-accent/[0.06] hover:bg-accent/15 hover:border-accent/60 transition-colors"
                >
                  My Account
                </a>
                <a
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center bg-accent text-obsidian font-semibold text-xl py-4 px-4 hover:bg-accent/80 transition-colors"
                >
                  Shop Now
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import Logo from "./Logo";

const quick = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "COAs", href: "/coas" },
  { label: "Protocols", href: "/protocols" },
  { label: "Contact", href: "/contact" },
];
const support = [
  { label: "My Account", href: "#" },
  { label: "FAQ", href: "/contact#faq" },
  { label: "Shipping Policy", href: "#" },
  { label: "Return Policy", href: "#" },
  { label: "Affiliate Portal", href: "/affiliates" },
];

export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Logo />
          <p className="font-mono text-bone text-xs tracking-wider mt-6 max-w-[240px]">
            Peptide Science. Human Potential.
          </p>
          <div className="flex gap-3 mt-6">
            {["IG", "X", "YT"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="h-10 w-10 border border-slate flex items-center justify-center text-bone hover:text-accent hover:border-accent transition-colors font-mono text-xs"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-sans font-medium text-paper text-sm tracking-wider uppercase mb-5">
            Quick Links
          </h4>
          <ul className="space-y-3">
            {quick.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="font-sans text-paper hover:text-accent transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-sans font-medium text-paper text-sm tracking-wider uppercase mb-5">
            Support
          </h4>
          <ul className="space-y-3">
            {support.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="font-sans text-paper hover:text-accent transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
          <p className="font-mono text-[10px] sm:text-[11px] text-bone leading-relaxed max-w-4xl">
            All products sold by Awaken Bio Labs are intended for research purposes only.
            Not for human consumption. These statements have not been evaluated by the FDA.
            Not intended to diagnose, treat, cure, or prevent any disease.
          </p>
          <p className="font-mono text-[10px] sm:text-[11px] text-bone">
            © 2025 Awaken Bio Labs. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

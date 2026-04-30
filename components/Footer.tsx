import Logo from "./Logo";
import { business, fullAddress } from "@/lib/business";

const quick = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "COAs", href: "/coas" },
  { label: "Affiliates", href: "/affiliates" },
  { label: "Contact", href: "/contact" },
];

const legal = [
  { label: "Terms of Use", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Returns & Refunds", href: "/returns" },
];

export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand + business info */}
        <div className="md:col-span-1">
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

        {/* Quick Links */}
        <div>
          <h4 className="font-sans font-medium text-paper text-sm tracking-wider uppercase mb-5">
            Site
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

        {/* Legal */}
        <div>
          <h4 className="font-sans font-medium text-paper text-sm tracking-wider uppercase mb-5">
            Legal
          </h4>
          <ul className="space-y-3">
            {legal.map((l) => (
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

        {/* Get In Touch */}
        <div>
          <h4 className="font-sans font-medium text-paper text-sm tracking-wider uppercase mb-5">
            Get In Touch
          </h4>
          <ul className="space-y-4 font-mono text-xs text-bone leading-relaxed">
            <li>
              <a
                href={`mailto:${business.email}`}
                className="text-paper hover:text-accent transition-colors block mb-1"
              >
                {business.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${business.phone.replace(/\D/g, "")}`}
                className="text-paper hover:text-accent transition-colors block mb-1"
              >
                {business.phone}
              </a>
            </li>
            <li className="pt-1 border-t border-slate">
              <p className="text-paper not-italic mt-3">
                {business.address.line1}
                {business.address.line2 && (
                  <>
                    <br />
                    {business.address.line2}
                  </>
                )}
                <br />
                {business.address.city}, {business.address.state}{" "}
                {business.address.zip}
              </p>
            </li>
            <li className="pt-1">{business.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
          <p className="font-mono text-[10px] sm:text-[11px] text-bone leading-relaxed max-w-4xl">
            All products sold by {business.name} are intended for research purposes
            only. Not for human consumption. These statements have not been
            evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent
            any disease.
          </p>
          <p className="font-mono text-[10px] sm:text-[11px] text-bone">
            © {new Date().getFullYear()} {business.legalName}. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

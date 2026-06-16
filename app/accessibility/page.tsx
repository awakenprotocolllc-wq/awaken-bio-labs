import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import { business } from "@/lib/business";

export const metadata = {
  title: `Accessibility Statement · ${business.name}`,
  description:
    "Awaken Bio Labs is committed to making our website accessible and usable for all visitors, including people with disabilities.",
};

export default function AccessibilityPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="ACCESSIBILITY"
        title="Accessibility Statement."
        subtitle="Our commitment to making this site usable for everyone."
      />

      <section className="bg-obsidian py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10 text-bone leading-relaxed">

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">Our Commitment</h2>
            <p>
              Awaken Bio Labs is committed to making our website accessible and usable for all
              visitors, including people with disabilities. We aim to follow the Web Content
              Accessibility Guidelines (WCAG) 2.1 Level AA, where reasonably possible.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">What We Are Doing</h2>
            <p>
              We are actively working to improve the accessibility and usability of our website.
              Ongoing efforts include:
            </p>
            <ul className="mt-3 space-y-2 list-none pl-0">
              {[
                "Providing text alternatives for non-text content",
                "Ensuring keyboard navigability throughout the site",
                "Maintaining sufficient color contrast for all text and UI elements",
                "Using semantic HTML landmarks and heading structure",
                "Labeling all form inputs and interactive controls",
                "Providing visible focus indicators for keyboard users",
                "Announcing dynamic content updates to screen readers",
                "Respecting user preferences for reduced motion",
                "Providing accessible names for icon-only buttons and links",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-accent mt-0.5 shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">
              Known Limitations
            </h2>
            <p>
              While we strive to meet WCAG 2.1 AA standards, some areas of the site may not yet
              be fully accessible. Certificate of Analysis (COA) documents are provided as
              third-party PDF files and may not meet full PDF accessibility standards. We are
              working to provide key COA information in accessible HTML format alongside each
              document link.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">Contact Us</h2>
            <p>
              If you experience difficulty accessing any part of this site, notice an
              accessibility issue, or need assistance with product information, COA
              documentation, or order-related information, please contact us:
            </p>
            <ul className="mt-4 space-y-3 list-none pl-0 font-mono text-sm">
              <li>
                <span className="text-bone/70 text-[10px] uppercase tracking-wider block mb-1">Email</span>
                <a
                  href={`mailto:${business.email}`}
                  className="text-accent hover:underline"
                >
                  {business.email}
                </a>
              </li>
              <li>
                <span className="text-bone/70 text-[10px] uppercase tracking-wider block mb-1">Phone</span>
                <a
                  href={`tel:${business.phone.replace(/\D/g, "")}`}
                  className="text-accent hover:underline"
                >
                  {business.phone}
                </a>
                <span className="block text-bone/60 text-[11px] mt-0.5">
                  {/* TODO: Replace with verified business phone number before launch */}
                  {business.hours}
                </span>
              </li>
            </ul>
            <p className="mt-4">
              Please include the page URL, a description of the issue, and the assistive
              technology, browser, or device you are using, if applicable. We will make
              reasonable efforts to respond and provide the information or service through
              an accessible method.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">
              Standards and Conformance
            </h2>
            <p>
              This site has been remediated toward WCAG 2.1 Level AA and selected WCAG 2.2
              Level AA criteria. This statement does not constitute a legal certification of
              full ADA or Section 508 compliance. If you require a formal accessibility
              audit or have legal accessibility concerns, please contact us directly.
            </p>
          </div>

          <div>
            <h2 className="font-sans font-bold text-paper text-xl mb-3">
              Technical Specifications
            </h2>
            <p>
              This website is built with Next.js and relies on the following technologies
              for accessibility:
            </p>
            <ul className="mt-3 space-y-1 list-none pl-0">
              {[
                "HTML5 semantic elements",
                "WAI-ARIA roles and attributes",
                "CSS media queries including prefers-reduced-motion",
                "Focus-visible CSS for keyboard focus indicators",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-accent mt-0.5 shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate pt-6">
            <p className="text-bone/60 text-sm font-mono">
              This accessibility statement was last updated: June 2026.
            </p>
          </div>

        </div>
      </section>
    </SiteShell>
  );
}

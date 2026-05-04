import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import { business } from "@/lib/business";

export const metadata = {
  title: `About · ${business.name}`,
  description:
    "Awaken Bio Labs is a Nevada-registered research compound supplier built on third-party verified purity, full COA transparency, and uncompromising standards.",
};

const standards = [
  {
    label: "Verified Purity",
    body: "Every batch independently tested by a US third-party laboratory. Minimum 99% purity, HPLC-confirmed.",
  },
  {
    label: "Certificate of Analysis",
    body: "Each product ships with a batch-specific COA. No black boxes. No trust-us assurances.",
  },
  {
    label: "GMP-Standard Manufacturing",
    body: "Compounds are produced in facilities adhering to current Good Manufacturing Practice standards.",
  },
  {
    label: "Cold-Chain Fulfillment",
    body: "Temperature-sensitive compounds ship with insulated, refrigerated packaging at no extra cost.",
  },
];

const values = [
  {
    n: "01",
    title: "Transparency Above All",
    body: "If we won't publish the COA, we won't sell the product. Every researcher should know exactly what's in the vial.",
  },
  {
    n: "02",
    title: "Quality Over Quantity",
    body: "We carry 47 of the most-researched compounds — not 200. Every SKU earns its place.",
  },
  {
    n: "03",
    title: "Built for Serious Work",
    body: "We supply the people doing the actual science. No marketing fluff. No miracle claims. Just clean compound.",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="OUR COMPANY"
        title="Built for serious researchers."
        subtitle={`${business.legalName} is a Nevada-registered research compound supplier. We exist because the people doing the actual work deserve a supplier that takes purity, transparency, and consistency as seriously as they do.`}
      />

      {/* Mission */}
      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — OUR MISSION —
          </p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6">
            Make the cleanest research compounds in the United States, and prove it on every label.
          </h2>
          <p className="text-bone text-lg leading-relaxed">
            The peptide research industry has a transparency problem. Suppliers cut
            corners. COAs are missing, faked, or buried. Purity claims go
            unverified. We started {business.name} to fix exactly that — by
            building a supplier that earns the trust of real researchers through
            verifiable, lab-confirmed standards on every single batch.
          </p>
        </div>
      </section>

      {/* Standards */}
      <section className="bg-carbon border-t border-b border-slate py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — OUR STANDARDS —
          </p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl leading-[1] tracking-tight mb-12 max-w-3xl">
            Non-negotiable from the first batch.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate">
            {standards.map((s) => (
              <div key={s.label} className="bg-carbon p-6 sm:p-8">
                <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-3">
                  ✓ {s.label}
                </p>
                <p className="text-bone leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — WHAT WE BELIEVE —
          </p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl leading-[1] tracking-tight mb-12">
            Our principles.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.n} className="border-t-2 border-accent pt-6">
                <p className="font-mono text-accent text-3xl mb-4">{v.n}</p>
                <h3 className="font-sans font-bold text-paper text-xl mb-3">
                  {v.title}
                </h3>
                <p className="text-bone leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verifiable business info */}
      <section className="bg-carbon border-t border-slate py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
            — VERIFIABLE —
          </p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl leading-[1] tracking-tight mb-8">
            A real business. On the public record.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail label="Legal Entity" value={business.legalName} />
            <Detail label="Jurisdiction" value="State of Nevada, USA" />
            <Detail label="NV Business ID" value={business.nvBusinessId} />
            <Detail label="Status" value="Active · In Good Standing" />
          </div>
          <p className="font-mono text-bone text-xs mt-8 max-w-2xl leading-relaxed">
            Our registration can be independently verified through the Nevada
            Secretary of State at{" "}
            <a
              href="https://www.nvsilverflume.gov/home"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              nvsilverflume.gov
            </a>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl leading-[1] tracking-tight mb-6">
            Run with serious. Or run blind.
          </h2>
          <p className="text-bone text-lg mb-10 max-w-xl mx-auto">
            47 verified compounds. Independent COAs. Built for the people doing the work.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/shop"
              className="bg-accent text-obsidian font-semibold px-8 h-12 inline-flex items-center hover:bg-accent/80 transition-colors"
            >
              Shop Catalog
            </Link>
            <Link
              href="/contact"
              className="border border-accent text-accent font-semibold px-8 h-12 inline-flex items-center hover:bg-accent/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-obsidian border border-slate p-5">
      <p className="font-mono text-[10px] text-bone tracking-[0.2em] uppercase mb-2">
        {label}
      </p>
      <p className="font-sans font-bold text-paper text-lg">{value}</p>
    </div>
  );
}

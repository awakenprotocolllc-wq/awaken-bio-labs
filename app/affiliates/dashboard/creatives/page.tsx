"use client";

import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";

const creatives = [
  {
    name: "Brand Logo Pack",
    desc: "PNG logo for use across digital platforms",
    count: 1,
    type: "Brand Assets",
    href: "/logo.png",
    download: "awaken-biolabs-logo.png",
  },
  {
    name: "Product Hero Shots",
    desc: "High-res PNG photography of every compound",
    count: 33,
    type: "Photography",
    href: "/api/download/products",
    download: "awaken-biolabs-product-images.zip",
  },
];

const copyTemplates = [
  {
    title: "Long-form Caption",
    body:
      "Awaken Bio Labs manufactures and tests research peptide compounds domestically — every batch is third-party verified at 99%+ purity with a COA available for download. For in-vitro research use only. Use code [YOUR-CODE] for 10% off research orders.",
  },
  {
    title: "Story / Quick Hit",
    body:
      "Domestic manufacturing. Third-party lab verified. COA on every batch. Awaken Bio Labs — research compounds, done right. Code [YOUR-CODE] for 10% off. Research use only. →",
  },
  {
    title: "Email Pitch",
    body:
      "Subject: A research compound supplier worth knowing\n\nQuick one — Awaken Bio Labs manufactures research peptide compounds in the US, with independent third-party testing and a COA available for every batch at 99%+ purity. For in-vitro research use only. Code [YOUR-CODE] gets 10% off.",
  },
];

export default function CreativesPage() {
  return (
    <AffiliateDashboardShell title="Creatives library.">
      <p className="text-bone mb-8 max-w-2xl">
        On-brand assets ready to deploy on day one. Download what you need, use across
        your platforms. New creatives drop monthly.
      </p>

      {/* Asset packs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate mb-12 max-w-2xl">
        {creatives.map((c) => (
          <div key={c.name} className="bg-carbon p-6 hover:bg-obsidian transition-colors">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">
                  {c.type}
                </p>
                <h3 className="font-sans font-bold text-paper text-lg">{c.name}</h3>
                <p className="text-bone text-sm mt-1">{c.desc}</p>
              </div>
              <span className="font-mono text-xs text-bone bg-slate px-2 py-1 flex-shrink-0">
                {c.count} {c.count === 1 ? "file" : "files"}
              </span>
            </div>
            <a
              href={c.href}
              download={c.download}
              className="inline-block font-mono text-xs tracking-wider uppercase border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 px-3 h-9 leading-[2.25rem] transition-colors mt-2"
            >
              Download Pack →
            </a>
          </div>
        ))}
      </div>

      {/* Copy templates */}
      <h2 className="font-sans font-bold text-paper text-2xl mb-1">Copy templates</h2>
      <p className="text-bone text-sm mb-6">
        Swipe-and-deploy captions. Replace [YOUR-CODE] with your code automatically by
        clicking copy.
      </p>
      <div className="space-y-4">
        {copyTemplates.map((t) => (
          <div key={t.title} className="bg-carbon border border-slate p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <p className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase">
                — {t.title.toUpperCase()} —
              </p>
              <button className="font-mono text-xs tracking-wider uppercase border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 px-3 h-9 transition-colors">
                Copy
              </button>
            </div>
            <p className="text-paper whitespace-pre-line leading-relaxed">{t.body}</p>
          </div>
        ))}
      </div>
    </AffiliateDashboardShell>
  );
}

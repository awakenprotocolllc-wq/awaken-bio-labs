"use client";

import AffiliateDashboardShell from "@/components/AffiliateDashboardShell";

const creatives = [
  { name: "Brand Logo Pack", desc: "Light + dark variants, SVG + PNG", count: 6, type: "Brand Assets" },
  { name: "Product Hero Shots", desc: "Studio photography of every compound", count: 47, type: "Photography" },
  { name: "Instagram Stories", desc: "9:16 templates ready for export", count: 12, type: "Social" },
  { name: "Instagram Posts", desc: "1:1 product spotlight cards", count: 18, type: "Social" },
  { name: "YouTube Banner Pack", desc: "Channel art + thumbnail templates", count: 8, type: "Video" },
  { name: "Email Header Templates", desc: "For newsletter integrations", count: 5, type: "Email" },
];

const copyTemplates = [
  {
    title: "Long-form Caption",
    body:
      "I've been using Awaken Bio Labs for my research compounds — verified 99%+ purity, third-party tested, every product ships with its own COA. If you take this work seriously, this is the supplier. Use my code [YOUR-CODE] for 10% off.",
  },
  {
    title: "Story / Quick Hit",
    body:
      "Not all peptide suppliers are equal. Awaken Bio Labs is the only one I trust — full transparency, lab-verified, fast shipping. Code [YOUR-CODE] for 10% off →",
  },
  {
    title: "Email Pitch",
    body:
      "Subject: The supplier I actually use\n\nQuick one — if you've been asking what I use for research compounds, the answer is Awaken Bio Labs. Third-party tested, 99%+ purity, COA on every product. Use code [YOUR-CODE] for 10% off your first order.",
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate mb-12">
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
                {c.count} files
              </span>
            </div>
            <button className="font-mono text-xs tracking-wider uppercase border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 px-3 h-9 transition-colors mt-2">
              Download Pack →
            </button>
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

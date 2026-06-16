import Link from "next/link";

const CATEGORIES = [
  {
    name: "GH Axis",
    description: "Peptides studied in the context of growth hormone secretion and receptor interactions. Includes CJC-1295, Ipamorelin, Sermorelin, IGF-1 LR3, and related compounds.",
    count: 8,
  },
  {
    name: "Repair & Recovery",
    description: "Research compounds frequently used in cell proliferation, wound-healing models, and connective tissue studies. Includes BPC-157, TB-500, GHK-Cu, and more.",
    count: 7,
  },
  {
    name: "Metabolic Research",
    description: "Compounds studied for metabolic signaling pathways and receptor activity. Includes GLP3-R (Retatrutide) and 5-Amino-1MQ.",
    count: 2,
  },
  {
    name: "Cognitive Research",
    description: "Neuropeptides used in in-vitro models exploring neurological signaling, stress response, and sleep-cycle regulation.",
    count: 5,
  },
  {
    name: "Longevity Research",
    description: "Compounds studied in the context of cellular senescence, mitochondrial function, and antioxidant pathways. Includes NAD+, MOTS-C, Epithalon, and more.",
    count: 6,
  },
  {
    name: "Blends",
    description: "Pre-formulated research compound combinations. Includes GLOW, Wolverine Blend, and KLOW — single-vial formulations for multi-compound research protocols.",
    count: 3,
  },
  {
    name: "Supplies",
    description: "Bacteriostatic water and reconstitution supplies for laboratory use. Required for preparing lyophilized research compounds.",
    count: 2,
  },
  {
    name: "All Other",
    description: "Additional research peptides not classified elsewhere, including PT-141 and Kisspeptin-10.",
    count: 2,
  },
];

export default function CategoryLandingCards() {
  return (
    <section className="bg-carbon border-t border-slate py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <p className="font-mono text-accent text-xs tracking-[0.25em] mb-3">— BROWSE BY CATEGORY —</p>
          <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl tracking-tight">
            Research Categories.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href="/shop"
              className="group bg-obsidian border border-slate hover:border-accent p-6 flex flex-col gap-4 transition-colors duration-200"
            >
              <div>
                <h3 className="font-sans font-bold text-paper text-base group-hover:text-accent transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="font-mono text-bone/50 text-[10px] tracking-wider mt-1">
                  {cat.count} compound{cat.count !== 1 ? "s" : ""}
                </p>
              </div>
              <p className="text-bone/70 text-sm leading-relaxed flex-1">
                {cat.description}
              </p>
              <span className="font-mono text-accent text-[10px] tracking-wider uppercase flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Browse Category →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

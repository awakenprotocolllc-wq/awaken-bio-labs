import { notFound } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { getProductBySlug, products, slugify } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: slugify(p.name) }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.name} · Awaken Bio Labs`,
    description: `${product.name} — ${product.category}. Research use only. Third-party tested for 99%+ purity.`,
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const related = products
    .filter((p) => p.category === product.category && p.name !== product.name)
    .slice(0, 4);

  return (
    <SiteShell>
      <section className="bg-obsidian border-b border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <nav className="font-mono text-xs text-bone tracking-wider">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <span className="mx-2 text-slate">/</span>
            <Link href="/shop" className="hover:text-accent">
              Shop
            </Link>
            <span className="mx-2 text-slate">/</span>
            <span className="text-paper">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="bg-obsidian">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Visual */}
          <div className="relative aspect-square bg-gradient-to-b from-carbon to-obsidian border border-slate overflow-hidden">
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[80%] h-[40%] blur-3xl opacity-50 rounded-full"
              style={{
                background: "radial-gradient(ellipse at center, #57C7D6 0%, transparent 70%)",
              }}
            />
            <svg
              className="absolute inset-0 m-auto h-[70%] w-auto"
              viewBox="0 0 120 300"
              fill="none"
            >
              <rect x="45" y="10" width="30" height="14" stroke="#2A2D33" strokeWidth="1.5" />
              <rect x="40" y="24" width="40" height="10" fill="#2A2D33" />
              <path
                d="M42 34 L42 270 Q42 285 60 285 Q78 285 78 270 L78 34 Z"
                stroke="#2A2D33"
                strokeWidth="1.5"
                fill="url(#vialGradDetail)"
              />
              <defs>
                <linearGradient id="vialGradDetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#141518" />
                  <stop offset="100%" stopColor="#57C7D6" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              <text
                x="60"
                y="160"
                textAnchor="middle"
                fill="#57C7D6"
                fontSize="9"
                fontFamily="monospace"
                letterSpacing="2"
              >
                AWAKEN
              </text>
              <text
                x="60"
                y="175"
                textAnchor="middle"
                fill="#D9D9DC"
                fontSize="6"
                fontFamily="monospace"
                letterSpacing="1"
              >
                {product.strengths[0].toUpperCase()} · LYOPHILIZED
              </text>
            </svg>
          </div>

          {/* Info */}
          <div>
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
              — {product.category.toUpperCase()} —
            </p>
            <h1 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl leading-[1] tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-4 mt-4">
              <span className="font-mono text-accent text-2xl font-semibold">
                {product.price ?? "—"}
              </span>
              <span className="font-mono text-bone text-xs tracking-wider">
                RESEARCH USE ONLY
              </span>
            </div>

            <div className="mt-8">
              <p className="font-mono text-bone text-xs tracking-wider uppercase mb-3">
                Select Strength
              </p>
              <div className="flex flex-wrap gap-2">
                {product.strengths.map((s, i) => (
                  <button
                    key={s}
                    className={`font-mono text-sm px-4 h-11 min-h-[44px] border transition-colors ${
                      i === 0
                        ? "border-accent text-accent bg-carbon"
                        : "border-slate text-bone hover:border-accent hover:text-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <a
                href={`mailto:support@awakenbiolabs.com?subject=Order%20Inquiry%3A%20${encodeURIComponent(product.name)}&body=Hi%2C%20I%27d%20like%20to%20order%20${encodeURIComponent(product.name)}%20(${encodeURIComponent(product.strengths[0])}).%20Please%20let%20me%20know%20how%20to%20proceed.`}
                className="bg-accent text-obsidian font-semibold h-12 min-h-[44px] flex items-center justify-center hover:bg-accent/80 transition-colors"
              >
                Place an Order
              </a>
              <Link
                href="/coas"
                className="border border-accent text-accent font-semibold h-12 min-h-[44px] flex items-center justify-center hover:bg-accent/10 transition-colors"
              >
                View COA
              </Link>
            </div>

            <div className="mt-10 border-t border-slate pt-8 space-y-5">
              <Detail label="Form" value="Lyophilized powder" />
              <Detail label="Purity" value="≥ 99% (HPLC verified)" />
              <Detail label="Storage" value="Refrigerate after reconstitution" />
              <Detail label="Shipping" value="FedEx 2-Day · Same-day if before 1PM" />
            </div>

            <div className="mt-8 bg-carbon border border-slate p-5">
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-2">
                — DISCLAIMER —
              </p>
              <p className="text-bone text-sm leading-relaxed">
                {product.name} is sold strictly for in-vitro research and laboratory
                experimentation. Not for human consumption, ingestion, or therapeutic use.
                Statements have not been evaluated by the FDA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-carbon border-t border-slate">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
              — RELATED COMPOUNDS —
            </p>
            <h2 className="font-sans font-bold text-paper text-3xl sm:text-4xl mb-8">
              Also in {product.category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link
                  key={r.name}
                  href={`/shop/${slugify(r.name)}`}
                  className="group bg-obsidian border border-slate hover:border-accent p-5 transition-colors"
                >
                  <h3 className="font-sans font-bold text-paper text-base group-hover:text-accent transition-colors">
                    {r.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.strengths.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[10px] text-accent bg-slate px-2 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="font-mono text-bone text-xs tracking-wider uppercase">{label}</span>
      <span className="text-paper font-sans text-sm text-right">{value}</span>
    </div>
  );
}

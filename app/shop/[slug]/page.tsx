import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import ResearchDisclaimer from "@/components/ResearchDisclaimer";
import ProductOrderSection from "@/components/ProductOrderSection";
import RecentlyViewedTracker from "@/components/RecentlyViewedTracker";
import { getProductBySlug, getProductImage, products, slugify } from "@/lib/products";
import { isOutOfStock } from "@/lib/stock-db";

// Re-render at most every 60s so admin stock toggles reach the storefront quickly
export const revalidate = 60;

export function generateStaticParams() {
  return products.map((p) => ({ slug: slugify(p.name) }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Not Found" };
  return {
    title: `${product.name} · Awaken Bio Labs`,
    description: `${product.name} — ${product.category}. For in-vitro research use only. Not for diagnostic, clinical, or other regulated applications. Third-party tested, ≥99% purity.`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const outOfStock = await isOutOfStock(params.slug);

  const related = products
    .filter((p) => p.category === product.category && p.name !== product.name)
    .slice(0, 4);

  return (
    <SiteShell>
      {/* Track this product as recently viewed (client-side, localStorage) */}
      <RecentlyViewedTracker productName={product.name} />

      <section className="bg-obsidian border-b border-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <nav aria-label="Breadcrumb" className="font-mono text-xs text-bone tracking-wider">
            <ol className="flex items-center gap-0 list-none p-0 m-0">
              <li><Link href="/" className="hover:text-accent">Home</Link></li>
              <li aria-hidden="true" className="mx-2 text-slate">/</li>
              <li><Link href="/shop" className="hover:text-accent">Shop</Link></li>
              <li aria-hidden="true" className="mx-2 text-slate">/</li>
              <li><span aria-current="page" className="text-paper">{product.name}</span></li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="bg-obsidian">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product image */}
          <div className="relative aspect-square bg-white border border-slate overflow-hidden">
            <Image
              src={getProductImage(product)}
              alt={`${product.name}${product.strengths.length === 1 ? ` ${product.strengths[0]}` : ""} research compound vial`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-10 sm:p-16"
            />
          </div>

          {/* Info */}
          <div>
            <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
              — {product.category.toUpperCase()} —
            </p>
            <h1 className="font-sans font-bold text-paper text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight break-words">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="font-mono text-accent/70 text-sm tracking-widest mt-2">
                {product.subtitle}
              </p>
            )}

            {/* Interactive: strength selector + CTA — client component */}
            <ProductOrderSection product={product} outOfStock={outOfStock} />

            <ResearchDisclaimer variant="inline" className="mt-4" />

            <div className="mt-8 border-t border-slate pt-8 space-y-5">
              <Detail label="Form" value="Lyophilized powder" />
              <Detail label="Purity" value="≥ 99% (HPLC verified)" />
              <Detail label="Storage" value="Refrigerate after reconstitution" />
              <Detail label="Shipping" value="Orders confirmed before 1:00 p.m. PT ship next business day when inventory is available. Carrier and delivery speed may vary." />
            </div>

            <div className="mt-8 bg-carbon border border-slate p-5">
              <p className="font-mono text-accent text-[10px] tracking-[0.2em] mb-2">
                — DISCLAIMER —
              </p>
              <p className="text-bone text-sm leading-relaxed">
                {product.name} is intended solely for in-vitro research and laboratory
                experimentation by qualified professionals. For in-vitro research use only — not for
                diagnostic, clinical, or other regulated applications. Statements have not been
                evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.
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
                      <span key={s} className="font-mono text-[10px] text-accent bg-slate px-2 py-0.5">
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

import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import CategoryLandingCards from "@/components/CategoryLandingCards";
import { getOutOfStockSlugs } from "@/lib/stock-db";

// Re-render at most every 60s so admin stock toggles reach the storefront quickly
export const revalidate = 60;

export const metadata = {
  title: "Shop · Awaken Bio Labs",
  description: "Research-grade peptide compounds for in-vitro laboratory use. Verified purity. Third-party tested. In-vitro research use only.",
};

export default async function ShopPage() {
  const outOfStock = await getOutOfStockSlugs();

  return (
    <SiteShell>
      <PageHeader
        eyebrow="CATALOG"
        title="The Full Catalog."
        subtitle="Research-grade compounds. Browse by category or use the filters below to narrow your search."
      />
      <CategoryLandingCards />
      <ProductGrid outOfStock={outOfStock} />
    </SiteShell>
  );
}

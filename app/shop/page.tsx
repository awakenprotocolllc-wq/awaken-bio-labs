import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import CategoryLandingCards from "@/components/CategoryLandingCards";

export const metadata = {
  title: "Shop · Awaken Bio Labs",
  description: "Research-grade peptide compounds for in-vitro laboratory use. Verified purity. Third-party tested. In-vitro research use only.",
};

export default function ShopPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="CATALOG"
        title="The Full Catalog."
        subtitle="Research-grade compounds. Browse by category or use the filters below to narrow your search."
      />
      <CategoryLandingCards />
      <ProductGrid />
    </SiteShell>
  );
}

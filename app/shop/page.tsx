import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";

export const metadata = {
  title: "Shop · Awaken Bio Labs",
  description: "Research-grade peptides. Verified purity. Third-party tested.",
};

export default function ShopPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="CATALOG"
        title="The Full Catalog."
        subtitle="Research-grade compounds. Filter by category, click any product for full details and Certificate of Analysis."
      />
      <ProductGrid />
    </SiteShell>
  );
}

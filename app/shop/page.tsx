import SiteShell from "@/components/SiteShell";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";

export const metadata = {
  title: "Shop · Awaken Bio Labs",
  description: "62 research compounds. Verified purity. Third-party tested.",
};

export default function ShopPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="CATALOG"
        title="The Full Catalog."
        subtitle="62 research compounds. Filter by category, click any product for full details, dosing references, and Certificate of Analysis."
      />
      <ProductGrid />
    </SiteShell>
  );
}

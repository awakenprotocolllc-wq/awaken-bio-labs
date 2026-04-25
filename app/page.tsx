import SiteShell from "@/components/SiteShell";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ProductGrid from "@/components/ProductGrid";
import WhyAwaken from "@/components/WhyAwaken";
import AffiliateCTA from "@/components/AffiliateCTA";

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <TrustBar />
      <ProductGrid />
      <WhyAwaken />
      <AffiliateCTA />
    </SiteShell>
  );
}

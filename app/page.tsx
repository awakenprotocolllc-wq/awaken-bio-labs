import dynamic from "next/dynamic";
import SiteShell from "@/components/SiteShell";
import Hero from "@/components/Hero";

// Below-fold client components — split into separate JS chunks
const TrustBar = dynamic(() => import("@/components/TrustBar"));
const ProductGrid = dynamic(() => import("@/components/ProductGrid"));
const WhyAwaken = dynamic(() => import("@/components/WhyAwaken"));
const AffiliateCTA = dynamic(() => import("@/components/AffiliateCTA"));

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

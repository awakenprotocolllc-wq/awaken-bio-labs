import AnnouncementBar from "@/components/AnnouncementBar";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ProductGrid from "@/components/ProductGrid";
import WhyAwaken from "@/components/WhyAwaken";
import ProtocolsTeaser from "@/components/ProtocolsTeaser";
import AffiliateCTA from "@/components/AffiliateCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-obsidian text-paper min-h-screen">
      <AnnouncementBar />
      <Nav />
      <Hero />
      <TrustBar />
      <ProductGrid />
      <WhyAwaken />
      <ProtocolsTeaser />
      <AffiliateCTA />
      <Footer />
    </main>
  );
}

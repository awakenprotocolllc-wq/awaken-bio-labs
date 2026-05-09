import AnnouncementBar from "./AnnouncementBar";
import Nav from "./Nav";
import Footer from "./Footer";
import CartProviderWrapper from "./CartProviderWrapper";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProviderWrapper>
      <main className="bg-obsidian text-paper min-h-screen flex flex-col">
        <AnnouncementBar />
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </main>
    </CartProviderWrapper>
  );
}

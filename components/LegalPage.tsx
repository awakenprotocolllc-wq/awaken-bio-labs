import SiteShell from "./SiteShell";
import PageHeader from "./PageHeader";
import { business } from "@/lib/business";

export default function LegalPage({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <section className="bg-obsidian py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="font-mono text-bone text-xs tracking-wider mb-10">
            EFFECTIVE DATE: {business.effectiveDate.toUpperCase()}
          </p>
          <article className="legal-content">{children}</article>
        </div>
      </section>
    </SiteShell>
  );
}

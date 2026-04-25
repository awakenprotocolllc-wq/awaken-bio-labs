export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative bg-obsidian border-b border-slate overflow-hidden grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-5">
          — {eyebrow} —
        </p>
        <h1 className="font-sans font-bold text-paper text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-bone mt-6 max-w-2xl text-base sm:text-lg leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

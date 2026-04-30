export default function AffiliateCTA() {
  return (
    <section
      id="affiliate"
      className="bg-carbon border-t border-b border-slate"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-24 text-center">
        <p className="font-mono text-accent text-xs tracking-[0.25em] mb-4">
          — PARTNER PROGRAM —
        </p>
        <h2 className="font-sans font-bold text-paper text-4xl sm:text-5xl md:text-6xl leading-[1] tracking-tight">
          Grow With Awaken.
        </h2>
        <p className="text-bone mt-5 max-w-2xl mx-auto text-base sm:text-lg">
          Your own portal. Unique tracking links. Real-time commission reporting.
          Built to run automatically.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/affiliates"
            className="inline-flex items-center justify-center bg-accent text-obsidian font-semibold px-8 h-12 min-h-[44px] hover:bg-accent/80 transition-colors"
          >
            Apply To Become An Affiliate
          </a>
          <a
            href="/affiliates/login"
            className="inline-flex items-center justify-center border border-accent text-accent font-semibold px-8 h-12 min-h-[44px] hover:bg-accent/10 transition-colors"
          >
            Affiliate Sign In
          </a>
        </div>
      </div>
    </section>
  );
}

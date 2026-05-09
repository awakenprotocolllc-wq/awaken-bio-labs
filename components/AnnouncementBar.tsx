export default function AnnouncementBar() {
  return (
    <div className="w-full bg-carbon border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center text-center">
        <p className="font-mono text-[10px] sm:text-[11px] text-bone tracking-wider uppercase leading-relaxed">
          <span className="text-accent font-semibold">🇺🇸 Made in the USA</span>
          <span className="text-accent mx-2 hidden xs:inline">·</span>
          <span className="hidden xs:inline text-accent font-semibold">Third-Party Tested</span>
          <span className="text-accent mx-2">·</span>
          <span>99%+ Purity</span>
          <span className="text-accent mx-2">·</span>
          <span>Research Use Only</span>
        </p>
      </div>
    </div>
  );
}

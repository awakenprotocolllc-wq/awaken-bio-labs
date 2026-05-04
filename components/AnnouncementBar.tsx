export default function AnnouncementBar() {
  return (
    <div className="w-full bg-carbon border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center text-center">
        <p className="font-mono text-[10px] sm:text-[11px] text-bone tracking-wider uppercase">
          <span className="text-accent font-semibold">🇺🇸 Made in the USA</span>
          <span className="text-accent mx-2">·</span>
          <span className="text-accent font-semibold">Third-Party Tested in the USA</span>
          <span className="text-accent mx-2">·</span>
          <span>99%+ purity</span>
          <span className="text-accent mx-2">·</span>
          <span>Research use only</span>
        </p>
      </div>
    </div>
  );
}

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-carbon border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center text-center">
        <p className="font-mono text-[10px] sm:text-[11px] text-bone tracking-wider uppercase">
          <span>Research use only</span>
          <span className="text-accent mx-2">·</span>
          <span>Third-party tested</span>
          <span className="text-accent mx-2">·</span>
          <span>99%+ purity guaranteed</span>
        </p>
      </div>
    </div>
  );
}

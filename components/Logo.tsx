export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-start leading-none select-none">
      <div className="flex items-center gap-2">
        {/* Molecular node icon */}
        <svg
          width={compact ? 18 : 22}
          height={compact ? 18 : 22}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <line x1="5" y1="6" x2="12" y2="13" stroke="#57C7D6" strokeWidth="1.5" />
          <line x1="19" y1="6" x2="12" y2="13" stroke="#57C7D6" strokeWidth="1.5" />
          <line x1="12" y1="13" x2="12" y2="21" stroke="#57C7D6" strokeWidth="1.5" />
          <circle cx="5" cy="6" r="2.2" fill="#57C7D6" />
          <circle cx="19" cy="6" r="2.2" fill="#57C7D6" />
          <circle cx="12" cy="21" r="2.2" fill="#57C7D6" />
        </svg>
        <span
          className={`font-sans font-bold tracking-[0.12em] text-paper ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          AWAKEN
        </span>
      </div>
      <span
        className={`font-mono text-accent tracking-[0.25em] mt-1 ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        — BIO LABS —
      </span>
    </div>
  );
}

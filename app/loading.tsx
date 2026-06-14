// Root-level loading — shown during any navigation not covered by a segment-level loading.tsx.
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center gap-10 relative overflow-hidden grain">
      {/* Top rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Corner marks */}
      <div className="absolute top-8 left-8 w-5 h-5 border-l border-t border-accent/20" />
      <div className="absolute top-8 right-8 w-5 h-5 border-r border-t border-accent/20" />
      <div className="absolute bottom-8 left-8 w-5 h-5 border-l border-b border-accent/20" />
      <div className="absolute bottom-8 right-8 w-5 h-5 border-r border-b border-accent/20" />

      {/* Brand */}
      <div className="loading-fade text-center space-y-2" style={{ animationDelay: "0ms" }}>
        <p className="font-mono text-[11px] text-accent tracking-[0.4em] uppercase">
          — Awaken Bio Labs —
        </p>
        <p className="font-mono text-[10px] text-bone/30 tracking-[0.3em] uppercase">
          Research-Grade Peptide Compounds
        </p>
      </div>

      {/* Scan bar */}
      <div
        className="loading-fade relative w-56 h-px bg-slate overflow-hidden"
        style={{ animationDelay: "80ms" }}
      >
        <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-transparent via-accent to-transparent loading-scan" />
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate to-transparent" />
    </div>
  );
}

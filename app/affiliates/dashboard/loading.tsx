// Route-level skeleton shown while the dashboard page loads or during navigation.
// Mirrors the AffiliateDashboardShell layout so there's no layout shift on hydration.
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col lg:flex-row">

      {/* ── Sidebar skeleton ─────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-72 bg-carbon border-r border-slate flex-shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-slate">
          <div className="h-6 w-32 bg-slate animate-pulse" />
        </div>

        {/* User card */}
        <div className="p-5 border-b border-slate space-y-2.5">
          <div className="h-2 w-20 bg-slate/60 animate-pulse" />
          <div className="h-4 w-40 bg-slate animate-pulse" />
          <div className="h-3 w-36 bg-slate/70 animate-pulse" />
          <div className="mt-1 h-6 w-24 bg-slate/40 animate-pulse" />
        </div>

        {/* Nav items */}
        <nav className="p-3 flex-1 space-y-1">
          {[100, 70, 85, 65, 75].map((w, i) => (
            <div
              key={i}
              className={`h-11 animate-pulse flex items-center px-4 gap-3 ${
                i === 0 ? "bg-accent/15" : "bg-slate/20"
              }`}
            >
              <div className={`h-3 w-3 rounded-none ${i === 0 ? "bg-accent/40" : "bg-slate/60"} animate-pulse`} />
              <div
                className={`h-2.5 bg-slate/50 animate-pulse`}
                style={{ width: `${w}%` }}
              />
            </div>
          ))}
        </nav>

        {/* Sign-out button */}
        <div className="p-5 border-t border-slate">
          <div className="h-11 border border-slate/50 animate-pulse" />
        </div>
      </aside>

      {/* ── Mobile top bar skeleton ───────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-carbon border-b border-slate sticky top-0 z-30">
        <div className="h-6 w-28 bg-slate animate-pulse" />
        <div className="h-8 w-8 bg-slate/50 animate-pulse" />
      </div>

      {/* ── Main content skeleton ──────────────────────────────── */}
      <div className="flex-1 p-5 sm:p-8 lg:p-10 max-w-6xl">

        {/* Page header */}
        <div className="mb-8 space-y-3">
          <div className="h-2.5 w-44 bg-slate/60 animate-pulse" />
          <div className="h-10 w-48 bg-slate animate-pulse" />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate mb-10">
          {[
            { label: 28, value: 16 },
            { label: 24, value: 12 },
            { label: 20, value: 8  },
            { label: 32, value: 14 },
          ].map(({ label, value }, i) => (
            <div key={i} className="bg-carbon p-5 sm:p-6 space-y-3">
              <div className={`h-2 bg-slate/60 animate-pulse`} style={{ width: `${label * 3}px` }} />
              <div className={`h-8 bg-slate animate-pulse`} style={{ width: `${value * 4}px` }} />
              <div className={`h-2 bg-slate/40 animate-pulse`} style={{ width: `${label * 2}px` }} />
            </div>
          ))}
        </div>

        {/* Referrals table */}
        <div className="bg-carbon border border-slate">
          {/* Table header */}
          <div className="p-6 border-b border-slate flex items-center justify-between gap-4">
            <div className="h-5 w-36 bg-slate animate-pulse" />
            <div className="h-3 w-28 bg-slate/50 animate-pulse" />
          </div>

          {/* Column headers */}
          <div className="hidden sm:flex gap-4 px-6 py-3 border-b border-slate">
            {[48, 40, 36, 96, 48, 48].map((w, i) => (
              <div key={i} className="h-2 bg-slate/40 animate-pulse flex-shrink-0" style={{ width: `${w}px` }} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 px-6 py-4 border-b border-slate last:border-0 items-center"
            >
              <div className="h-3 w-16 bg-slate/50 animate-pulse flex-shrink-0" />
              <div className="h-3 w-12 bg-slate/50 animate-pulse flex-shrink-0" />
              <div className="h-3 flex-1 bg-slate/40 animate-pulse" />
              <div className="h-3 w-14 bg-slate/50 animate-pulse flex-shrink-0" />
              <div className="h-3 w-14 bg-slate/60 animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

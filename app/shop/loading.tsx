// Shown during client-side navigation to /shop before ProductGrid hydrates.
export default function ShopLoading() {
  // Approximate widths for the filter pill skeletons
  const pillWidths = [28, 64, 80, 72, 88, 68, 76, 60];

  return (
    <div className="bg-obsidian min-h-screen">
      {/* ── Page header skeleton ────────────────────────── */}
      <div className="px-5 sm:px-8 lg:px-16 py-14 sm:py-20 border-b border-slate">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-2.5 w-20 bg-slate/60 animate-pulse" />
          <div className="h-12 w-72 bg-slate animate-pulse" />
          <div className="h-3 w-96 max-w-full bg-slate/50 animate-pulse mt-2" />
          <div className="h-3 w-64 bg-slate/40 animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 py-10 sm:py-14">

        {/* ── Filter pills skeleton ───────────────────── */}
        <div className="flex gap-2 overflow-hidden mb-10">
          {pillWidths.map((w, i) => (
            <div
              key={i}
              className="h-9 flex-shrink-0 bg-slate/40 animate-pulse border border-slate/60"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* ── Product grid skeleton ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-slate">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-carbon flex flex-col">
      {/* Image area */}
      <div className="aspect-square bg-slate/30 animate-pulse relative overflow-hidden">
        {/* Subtle diagonal shimmer to break up the empty image space */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate/20 to-transparent" />
      </div>

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Eyebrow / category */}
        <div className="h-2 w-16 bg-slate/50 animate-pulse" />
        {/* Product name */}
        <div className="h-5 w-40 bg-slate animate-pulse" />
        {/* Subtitle */}
        <div className="h-3 w-32 bg-slate/50 animate-pulse" />
        {/* Price */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="h-5 w-16 bg-slate animate-pulse" />
          <div className="h-8 w-24 bg-slate/30 border border-slate animate-pulse" />
        </div>
      </div>
    </div>
  );
}

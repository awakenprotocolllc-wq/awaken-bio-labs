// <ResearchDisclaimer variant="banner" />
// <ResearchDisclaimer variant="inline" className="mt-4" />

const COPY =
  "For Research Use Only. Not for human or veterinary use. These products have not been evaluated or approved by the FDA to diagnose, treat, cure, or prevent any disease or medical condition. In-vitro use only.";

export default function ResearchDisclaimer({
  variant,
  className = "",
}: {
  variant: "banner" | "inline";
  className?: string;
}) {
  if (variant === "banner") {
    return (
      <div className={`w-full bg-obsidian ${className}`}>
        <p className="font-mono text-[11px] text-white/40 tracking-widest uppercase text-center px-4 py-2 leading-relaxed">
          {COPY}
        </p>
      </div>
    );
  }

  return (
    <p
      className={`font-mono text-[11px] text-white/30 leading-relaxed ${className}`}
    >
      {COPY}
    </p>
  );
}

import Image from "next/image";

export default function Logo({ compact = false }: { compact?: boolean }) {
  // Source image is roughly 16:9 (the white wordmark on transparent/black bg).
  // Render at fixed heights for predictable layout, width auto-scales.
  const height = compact ? 44 : 64;
  const width = Math.round(height * 2.6); // approximate aspect ratio

  return (
    <Image
      src="/logo.png"
      alt="Awaken Bio Labs"
      width={width}
      height={height}
      priority
      className="h-auto w-auto select-none"
      style={{ height: `${height}px` }}
    />
  );
}

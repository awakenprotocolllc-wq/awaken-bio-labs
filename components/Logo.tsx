import Image from "next/image";

export default function Logo({ compact = false }: { compact?: boolean }) {
  const height = compact ? 44 : 64;
  const width = Math.round(height * 4); // 2000x500 source aspect ratio

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

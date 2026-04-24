# Awaken Bio Labs — Homepage

Next.js 14 (App Router) + Tailwind CSS + Framer Motion.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Brand Palette

| Token    | Hex       |
| -------- | --------- |
| obsidian | `#0A0B0D` |
| carbon   | `#141518` |
| slate    | `#2A2D33` |
| bone     | `#D9D9DC` |
| paper    | `#F4F4F2` |
| accent   | `#57C7D6` |

Fonts: Space Grotesk (headings/UI), JetBrains Mono (labels/codes) via `next/font/google`.

## Structure

```
/app              layout.tsx, page.tsx, globals.css
/components       Nav, Hero, TrustBar, ProductGrid, ProductCard,
                  WhyAwaken, ProtocolsTeaser, AffiliateCTA, Footer,
                  AnnouncementBar, Logo
/lib/products.ts  62 research compounds with category tags
```

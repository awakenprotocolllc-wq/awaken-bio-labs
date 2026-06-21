export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { zipSync } from "fflate";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// 20 downloads per hour per IP — generous for legitimate affiliate use
const RATE_LIMIT = 20;
const WINDOW_SECONDS = 60 * 60;

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await rateLimit(
      `download-products:${clientIp(req)}`,
      RATE_LIMIT,
      WINDOW_SECONDS
    );
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const dir = path.join(process.cwd(), "public", "products");
    const files = await readdir(dir);
    const pngs = files.filter((f) => f.endsWith(".png"));

    const entries: Record<string, Uint8Array> = {};
    await Promise.all(
      pngs.map(async (filename) => {
        const buf = await readFile(path.join(dir, filename));
        entries[filename] = new Uint8Array(buf);
      })
    );

    const zipped = zipSync(entries, { level: 0 });

    return new NextResponse(zipped, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="awaken-biolabs-product-images.zip"',
      },
    });
  } catch (err) {
    console.error("[GET /api/download/products]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate download." },
      { status: 500 }
    );
  }
}

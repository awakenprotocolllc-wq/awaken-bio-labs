export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { zipSync } from "fflate";

export async function GET() {
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
}

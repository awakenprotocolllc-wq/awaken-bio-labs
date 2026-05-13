import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/affiliate-db";

// GET /api/affiliate/validate-code?code=AFFILIATECODE
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, discountRate: 0 });
  }

  const result = await validateDiscountCode(code);
  return NextResponse.json(result);
}

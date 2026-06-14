import { NextRequest, NextResponse } from "next/server";
import { deleteCustomerSession } from "@/lib/customer-db";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("awaken_customer")?.value;
    if (token) await deleteCustomerSession(token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("awaken_customer", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    return apiError("customer:logout", err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getOutOfStockSlugs, setOutOfStock, isOutOfStock, popRestockSubscribers, getRestockSubscriberCount } from "@/lib/stock-db";
import { getCustomerById } from "@/lib/customer-db";
import { sendBackInStockEmail } from "@/lib/stock-emails";
import { products, slugify, getProductBySlug } from "@/lib/products";
import { validateAdminSession } from "@/lib/admin-auth";
import { apiError } from "@/lib/api-error";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://awakenbiolabs.com";

// GET /api/admin/stock — out-of-stock slugs + pending subscriber counts (admin only)
export async function GET(req: NextRequest) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const outOfStock = await getOutOfStockSlugs();
    const subscriberCounts: Record<string, number> = {};
    await Promise.all(
      products.map(async (p) => {
        const slug = slugify(p.name);
        const count = await getRestockSubscriberCount(slug);
        if (count > 0) subscriberCounts[slug] = count;
      })
    );

    return NextResponse.json({ ok: true, outOfStock, subscriberCounts });
  } catch (err) {
    return apiError("GET /api/admin/stock", err);
  }
}

// PATCH /api/admin/stock — toggle a product's stock state (admin only)
// body: { slug: string, out: boolean }
// Toggling out→in sends restock emails to all subscribers and clears the list.
export async function PATCH(req: NextRequest) {
  try {
    if (!(await validateAdminSession(req.cookies.get("awaken_admin")?.value))) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) ?? {};
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const out = body.out;

    if (!slug || slug.length > 100 || typeof out !== "boolean") {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const product = getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Unknown product" }, { status: 404 });
    }

    const wasOut = await isOutOfStock(slug);
    await setOutOfStock(slug, out);

    // Restocked → notify everyone on the waitlist, then clear it
    let notified = 0;
    if (wasOut && !out) {
      const subscriberIds = await popRestockSubscribers(slug);
      const productUrl = `${SITE}/shop/${slug}`;

      const results = await Promise.allSettled(
        subscriberIds.map(async (customerId) => {
          const customer = await getCustomerById(customerId);
          if (!customer) return;
          const res = await sendBackInStockEmail({
            to: customer.email,
            customerName: customer.name,
            productName: product.name,
            productUrl,
          });
          if (!res.ok) throw new Error(`delivery failed for ${customerId}`);
          notified++;
        })
      );
      const failures = results.filter((r) => r.status === "rejected").length;
      if (failures > 0) {
        console.error(`[admin/stock] ${failures} restock email(s) failed for ${slug}`);
      }
      console.log(`[admin/stock] ${product.name} restocked — notified ${notified} customer(s)`);
    }

    return NextResponse.json({ ok: true, slug, out, notified });
  } catch (err) {
    return apiError("PATCH /api/admin/stock", err);
  }
}

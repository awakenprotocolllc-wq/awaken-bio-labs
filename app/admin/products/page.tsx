import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession } from "@/lib/admin-auth";
import { getOutOfStockSlugs, getRestockSubscriberCount } from "@/lib/stock-db";
import { products, slugify } from "@/lib/products";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products · Admin · Awaken Bio Labs" };

export default async function AdminProductsPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) {
    redirect("/admin/login");
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

  return (
    <ProductsClient
      initialOutOfStock={outOfStock}
      initialSubscriberCounts={subscriberCounts}
    />
  );
}

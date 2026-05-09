import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/db";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin · Awaken Bio Labs" };

export default async function AdminOrdersPage() {
  // Server-side auth check (belt-and-suspenders alongside middleware)
  const cookieStore = cookies();
  const token = cookieStore.get("awaken_admin")?.value;
  if (!token || token !== process.env.ADMIN_SESSION_TOKEN) {
    redirect("/admin/login");
  }

  const orders = await listOrders();

  return <OrdersClient initialOrders={orders} />;
}

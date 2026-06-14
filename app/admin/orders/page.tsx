import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/db";
import { validateAdminSession } from "@/lib/admin-auth";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin · Awaken Bio Labs" };

export default async function AdminOrdersPage() {
  // Server-side auth check (belt-and-suspenders alongside middleware)
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) {
    redirect("/admin/login");
  }

  const orders = await listOrders();

  return <OrdersClient initialOrders={orders} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession } from "@/lib/admin-auth";
import { listCustomers, getCustomerOrderIds } from "@/lib/customer-db";
import { getOrder } from "@/lib/db";
import CustomersClient from "./CustomersClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers · Admin · Awaken Bio Labs" };

export default async function AdminCustomersPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) redirect("/admin/login");

  const customers = await listCustomers();

  const enriched = await Promise.all(customers.map(async (c) => {
    const orderIds = await getCustomerOrderIds(c.id);
    const orders = (await Promise.all(orderIds.map((id) => getOrder(id)))).filter(Boolean);
    const totalSpend = orders.reduce((sum, o) => {
      const n = parseFloat((o!.orderTotal ?? o!.subtotal).replace(/[^0-9.]/g, ""));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
    const lastOrderAt = orders.length > 0 ? orders[0]!.createdAt : null;
    return { ...c, orderCount: orders.length, totalSpend, lastOrderAt };
  }));

  return <CustomersClient initialCustomers={enriched} />;
}

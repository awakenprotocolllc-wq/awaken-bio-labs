import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession } from "@/lib/admin-auth";
import PayoutsClient from "./PayoutsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts · Admin · Awaken Bio Labs" };

export default async function AdminPayoutsPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) {
    redirect("/admin/login");
  }
  return <PayoutsClient />;
}

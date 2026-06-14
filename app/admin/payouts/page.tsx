import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PayoutsClient from "./PayoutsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts · Admin · Awaken Bio Labs" };

export default async function AdminPayoutsPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!token || token !== process.env.ADMIN_SESSION_TOKEN) {
    redirect("/admin/login");
  }
  return <PayoutsClient />;
}

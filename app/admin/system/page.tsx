import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SystemClient from "./SystemClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "System · Admin · Awaken Bio Labs" };

export default async function AdminSystemPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("awaken_admin")?.value;
  if (!token || token !== process.env.ADMIN_SESSION_TOKEN) {
    redirect("/admin/login");
  }
  return <SystemClient />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listApplications, listAffiliates } from "@/lib/affiliate-db";
import AffiliatesClient from "./AffiliatesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Affiliates · Admin · Awaken Bio Labs" };

export default async function AdminAffiliatesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("awaken_admin")?.value;
  if (!token || token !== process.env.ADMIN_SESSION_TOKEN) {
    redirect("/admin/login");
  }

  const [applications, affiliates] = await Promise.all([
    listApplications(),
    listAffiliates(),
  ]);

  return (
    <AffiliatesClient
      initialApplications={applications}
      initialAffiliates={affiliates}
    />
  );
}

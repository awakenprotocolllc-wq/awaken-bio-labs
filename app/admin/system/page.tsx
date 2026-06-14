import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession, getPasswordRotationStatus } from "@/lib/admin-auth";
import SystemClient from "./SystemClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "System · Admin · Awaken Bio Labs" };

function envStatus(key: string) {
  const val = process.env[key];
  if (!val) return { status: "missing" as const, chars: 0 };
  return { status: "set" as const, chars: val.length };
}

async function testShipStation() {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  if (!key || !secret) return { ok: false, error: "API key or secret not set" };
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  try {
    const res = await fetch("https://ssapi.shipstation.com/orders?pageSize=1", {
      headers: { Authorization: auth },
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    return { ok: false, status: res.status, error: text.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export default async function AdminSystemPage() {
  const token = cookies().get("awaken_admin")?.value;
  if (!(await validateAdminSession(token))) {
    redirect("/admin/login");
  }

  const envVars = {
    QUIKLIE_API_KEY: envStatus("QUIKLIE_API_KEY"),
    QUIKLIE_MERCHANT_ID: envStatus("QUIKLIE_MERCHANT_ID"),
    SHIPSTATION_API_KEY: envStatus("SHIPSTATION_API_KEY"),
    SHIPSTATION_API_SECRET: envStatus("SHIPSTATION_API_SECRET"),
    RESEND_API_KEY: envStatus("RESEND_API_KEY"),
    ADMIN_SESSION_TOKEN: envStatus("ADMIN_SESSION_TOKEN"),
    KV_REST_API_URL: envStatus("KV_REST_API_URL"),
    KV_REST_API_TOKEN: envStatus("KV_REST_API_TOKEN"),
  };

  const [shipstation, rotationStatus] = await Promise.all([
    testShipStation(),
    getPasswordRotationStatus(),
  ]);

  return <SystemClient envVars={envVars} shipstation={shipstation} rotationStatus={rotationStatus} />;
}

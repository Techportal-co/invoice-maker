import { cookies } from "next/headers";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return envUrl?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function getCustomers() {
  const baseUrl = getBaseUrl();
  const init: RequestInit = { cache: "no-store" };

  if (typeof window === "undefined") {
    const cookieHeader = (await cookies()).toString();
    if (cookieHeader) {
      init.headers = { cookie: cookieHeader };
    }
  } else {
    init.credentials = "include";
  }

  const res = await fetch(`${baseUrl}/api/test/customers`, init);
  return res.json();
}


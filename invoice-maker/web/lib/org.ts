import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requireOrg() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  const cookieStore = await cookies();
  const orgId = cookieStore.get("active_org_id")?.value;

  if (!orgId) {
    return { ok: false as const, status: 400, error: "No active organization" };
  }

  return { ok: true as const, orgId, userId: data.user.id };
}

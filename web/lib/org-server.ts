import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabaseAdmin";

export async function getOrgIdForRequest(defaultOrgName = "My Organization") {
  const sessionSupabase = await createSessionClient();
  const admin = createAdminClient();

  const { data: userData, error: userErr } = await sessionSupabase.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false as const, status: 401, error: "Not authenticated" };
  }

  const userId = userData.user.id;

  // 1) Find existing org membership
  const { data: memberships, error: memErr } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (memErr) {
    return { ok: false as const, status: 500, error: memErr.message };
  }

  if (memberships && memberships.length > 0) {
    return { ok: true as const, orgId: memberships[0].organization_id, userId };
  }

  // 2) No org yet → create org
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: defaultOrgName, owner_id: userId })
    .select("id")
    .single();

  if (orgErr) {
    return { ok: false as const, status: 500, error: orgErr.message };
  }

  // 3) Create membership
  const { error: linkErr } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  if (linkErr) {
    return { ok: false as const, status: 500, error: linkErr.message };
  }

  return { ok: true as const, orgId: org.id, userId };
}

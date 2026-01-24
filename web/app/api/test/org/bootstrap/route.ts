export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const sessionSupabase = await createSessionClient();
    const admin = createAdminClient();

    const { data: userData, error: userErr } = await sessionSupabase.auth.getUser();
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orgName =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim()
        : "My Organization";

    // If user already has an org, reuse it
    const { data: existing, error: existingErr } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userData.user.id)
      .limit(1);

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    let orgId: string;

    if (existing && existing.length > 0) {
      orgId = existing[0].organization_id;
    } else {
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({ name: orgName, owner_id: userData.user.id })
        .select("id")
        .single();

      if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

      orgId = org.id;

      const { error: memErr } = await admin.from("organization_members").insert({
        organization_id: orgId,
        user_id: userData.user.id,
        role: "owner",
      });

      if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    // ✅ set active org cookie on the response
    const res = NextResponse.json({ organization_id: orgId }, { status: 201 });
    res.cookies.set("active_org_id", orgId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

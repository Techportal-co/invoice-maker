export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET() {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok)
      return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_aging_report", {
      p_org_id: org.orgId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { aging: data ?? [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

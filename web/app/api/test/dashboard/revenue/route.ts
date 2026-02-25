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

    const [
      { data: summary, error: summaryErr },
      { data: breakdown, error: breakdownErr },
    ] = await Promise.all([
      supabase.rpc("get_revenue_summary", { p_org_id: org.orgId }),
      supabase.rpc("get_monthly_breakdown", { p_org_id: org.orgId }),
    ]);

    if (summaryErr) {
      return NextResponse.json({ error: summaryErr.message }, { status: 500 });
    }

    if (breakdownErr) {
      return NextResponse.json({ error: breakdownErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        summary: summary?.[0] ?? {
          total_invoiced: 0,
          total_paid: 0,
          total_outstanding: 0,
          total_draft: 0,
        },
        monthly_breakdown: breakdown ?? [],
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

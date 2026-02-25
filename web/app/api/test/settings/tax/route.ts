export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

const VALID_TAX_TYPES = ["standard", "reduced", "zero", "exempt"] as const;

export async function GET() {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data, error } = await supabase
      .from("organization_tax_rates")
      .select("id, tax_type, tax_rate")
      .eq("organization_id", org.orgId)
      .order("tax_type");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { tax_rates: data ?? [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const body = await req.json();
    const { tax_type, tax_rate } = body;

    if (!VALID_TAX_TYPES.includes(tax_type)) {
      return NextResponse.json(
        { error: `tax_type must be one of: ${VALID_TAX_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const rate = Number(tax_rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return NextResponse.json(
        { error: "tax_rate must be a decimal between 0 and 1 (e.g. 0.20 for 20%)" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("organization_tax_rates")
      .upsert(
        { organization_id: org.orgId, tax_type, tax_rate: rate },
        { onConflict: "organization_id,tax_type" }
      )
      .select("id, tax_type, tax_rate")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ tax_rate: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

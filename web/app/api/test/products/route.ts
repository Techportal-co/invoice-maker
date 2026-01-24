export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET() {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, organization_id, name, sku, category, unit_price, tax_rate, quantity_on_hand, reorder_level, is_active, created_at"
      )
      .eq("organization_id", org.orgId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { products: data ?? [] },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const unit_price = Number(body?.unit_price);
    const tax_rate = Number(body?.tax_rate);

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      return NextResponse.json({ error: "unit_price must be >= 0" }, { status: 400 });
    }
    if (!Number.isFinite(tax_rate) || tax_rate < 0) {
      return NextResponse.json({ error: "tax_rate must be >= 0" }, { status: 400 });
    }

    const quantity_on_hand =
      body?.quantity_on_hand === "" || body?.quantity_on_hand === undefined
        ? 0
        : Number(body?.quantity_on_hand);

    const reorder_level =
      body?.reorder_level === "" || body?.reorder_level === undefined
        ? 0
        : Number(body?.reorder_level);

    if (!Number.isFinite(quantity_on_hand) || quantity_on_hand < 0) {
      return NextResponse.json({ error: "quantity_on_hand must be >= 0" }, { status: 400 });
    }
    if (!Number.isFinite(reorder_level) || reorder_level < 0) {
      return NextResponse.json({ error: "reorder_level must be >= 0" }, { status: 400 });
    }

    const payload = {
      organization_id: org.orgId,
      name,
      description: body?.description ? String(body.description) : null,
      sku: body?.sku ? String(body.sku) : null,
      category: body?.category ? String(body.category) : null,
      unit_price,
      tax_rate,
      quantity_on_hand,
      reorder_level,
      is_active: typeof body?.is_active === "boolean" ? body.is_active : true,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ product_id: data.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

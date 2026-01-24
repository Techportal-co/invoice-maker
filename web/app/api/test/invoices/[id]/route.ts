export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        status,
        subtotal,
        total,
        created_at,
        customer:customers (
          id,
          name,
          email,
          phone
        ),
        invoice_line_items (
          id,
          product_id,
          description,
          quantity,
          unit_price,
          tax_rate,
          line_total
        )
      `
      )
      .eq("id", id)
      .eq("organization_id", org.orgId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    return NextResponse.json(
      { invoice: data },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();
    const body = await req.json();
    const allowed = ["status", "invoice_number"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", org.orgId)
      .select("id, invoice_number, status, total")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ invoice: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    // Delete line items first to satisfy FK constraints
    const { error: itemsError } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", id);

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("organization_id", org.orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

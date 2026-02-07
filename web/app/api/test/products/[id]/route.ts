export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createClient();
  const org = await getOrgIdForRequest();
  if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.orgId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ product: data });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createClient();
  const org = await getOrgIdForRequest();
  if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

  const body = await req.json();
  const updates: Record<string, any> = {};
  const allowed = [
    "name",
    "product_number",
    "description",
    "sku",
    "category",
    "unit",
    "unit_price",
    "tax_type",
    "reorder_level",
    "is_active",
  ];
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", org.orgId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createClient();
  const org = await getOrgIdForRequest();
  if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

  // Delete dependent line items first to satisfy FK constraints
  const { error: itemsError } = await supabase
    .from("invoice_line_items")
    .delete()
    .eq("product_id", id);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("organization_id", org.orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

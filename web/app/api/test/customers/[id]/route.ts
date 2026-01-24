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
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", org.orgId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ customer: data });
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
    "email",
    "phone",
    "website",
    "address",
    "city",
    "state",
    "country",
    "postal_code",
    "tax_id",
    "notes",
    "is_active",
  ];
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", org.orgId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ customer: data });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createClient();
  const org = await getOrgIdForRequest();
  if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

  // Find invoices for this customer (client_id)
  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .select("id")
    .eq("client_id", id)
    .eq("organization_id", org.orgId);

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  const invoiceIds = (invoices ?? []).map((inv: any) => inv.id);

  if (invoiceIds.length > 0) {
    const { error: liErr } = await supabase
      .from("invoice_line_items")
      .delete()
      .in("invoice_id", invoiceIds);
    if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 });

    const { error: delInvErr } = await supabase
      .from("invoices")
      .delete()
      .in("id", invoiceIds)
      .eq("organization_id", org.orgId);
    if (delInvErr) return NextResponse.json({ error: delInvErr.message }, { status: 500 });
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("organization_id", org.orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

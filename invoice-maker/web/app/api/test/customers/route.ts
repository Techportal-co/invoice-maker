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
      .from("customers")
      .select("*")
      .eq("organization_id", org.orgId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      { customers: data ?? [] },
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

    // Basic validation
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // IMPORTANT:
    // If organization_id is required in DB, either:
    // 1) Provide it from auth/org flow later, or
    // 2) Temporarily set a default org_id here.
    const payload = {
      organization_id: org.orgId, // ✅ ALWAYS set automatically
      name,
      contact_first_name: body?.contact_first_name ?? null,
      contact_last_name: body?.contact_last_name ?? null,
      fax_number: body?.fax_number ?? null,
      payment_terms: body?.payment_terms ?? null,
      mode_of_payment: body?.mode_of_payment ?? null,
      mode_of_delivery: body?.mode_of_delivery ?? null,
      delivery_terms: body?.delivery_terms ?? null,
      email: body?.email ?? null,
      phone: body?.phone ?? null,
      website: body?.website ?? null,
      billing_address: body?.billing_address ?? null,
      billing_city: body?.billing_city ?? null,
      billing_state: body?.billing_state ?? null,
      billing_country: body?.billing_country ?? null,
      billing_postal_code: body?.billing_postal_code ?? null,
      shipping_address: body?.shipping_address ?? null,
      shipping_city: body?.shipping_city ?? null,
      shipping_state: body?.shipping_state ?? null,
      shipping_country: body?.shipping_country ?? null,
      shipping_postal_code: body?.shipping_postal_code ?? null,
      city: body?.city ?? null,
      state: body?.state ?? null,
      country: body?.country ?? null,
      postal_code: body?.postal_code ?? null,
      tax_id: body?.tax_id ?? null,
      notes: body?.notes ?? null,
      is_active: typeof body?.is_active === "boolean" ? body.is_active : true,
    };

    const { data, error } = await supabase
      .from("customers")
      .insert(payload)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ customer_id: data.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

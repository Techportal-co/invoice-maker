// web/app/api/invoices/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(`*, invoice_line_items(*), clients(*) , payments(*)`)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { error } = await supabaseAdmin.from("invoices").delete().eq("id", id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("invoices").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data });
}

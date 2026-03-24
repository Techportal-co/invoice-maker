import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .limit(1);

  return NextResponse.json({ data, error });
}

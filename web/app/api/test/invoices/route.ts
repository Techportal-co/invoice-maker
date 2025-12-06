// web/app/api/invoices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const per = Number(url.searchParams.get("per") ?? "10");
    const sort = url.searchParams.get("sort") ?? "invoice_date";
    const order = (url.searchParams.get("order") ?? "desc") as "asc" | "desc";
    const status = url.searchParams.get("status") ?? undefined;
    const clientId = url.searchParams.get("client") ?? undefined;

    const from = (page - 1) * per;
    const to = from + per - 1;

    let query = supabaseAdmin
      .from("invoices")
      .select(
        `id, invoice_date, due_date, status, subtotal, tax_amount, discount_amount, total, client_id, created_at, clients(name)`
      , { count: "exact" }) // count exact total
      .order(sort, { ascending: order === "asc" })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (clientId) query = query.eq("client_id", clientId);

    const { data, error, count } = await query;

    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ data, page, per, total: count ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

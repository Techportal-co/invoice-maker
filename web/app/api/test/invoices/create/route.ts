import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ⬅️ Use environment variables (recommended)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      organization_id,
      client_id,
      invoice_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      discount_amount,
      total,
      currency,
      notes,
      terms_condition,
      items,
    } = data;

    // 1️⃣ Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([
        {
          organization_id,
          client_id,
          invoice_date,
          due_date,
          status,
          subtotal,
          tax_amount,
          discount_amount,
          total,
          currency,
          notes,
          terms_condition,
        },
      ])
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice insert error:", invoiceError);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    // 2️⃣ Insert line items
    const lineItemsPayload = items.map((item: any, index: number) => ({
      invoice_id: invoice.id,
      product_id: item.product_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate ?? 0,
      line_total: item.quantity * item.unit_price,
      sort_order: index,
    }));

    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemsPayload);

    if (lineItemsError) {
      console.error("Line items insert error:", lineItemsError);
      return NextResponse.json(
        { error: "Invoice created but line items failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Invoice created", invoice_id: invoice.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

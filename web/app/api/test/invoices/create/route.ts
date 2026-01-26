import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

type LineItemInput = {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // 0.05 = 5%
};

export async function POST(req: Request) {
  const supabase = createClient();

  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const body = await req.json();

    // DB column is still client_id; accept customer_id from client and map to client_id.
    const client_id = body?.customer_id as string | undefined;
    const line_items = body?.line_items as LineItemInput[] | undefined;

    if (!client_id || client_id === "undefined") {
      return NextResponse.json(
        { error: "customer_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: "line_items must be a non-empty array" }, { status: 400 });
    }

    // Basic validation / normalization
    const normalizedItems = line_items.map((li, idx) => {
      const description = (li?.description ?? "").trim();
      const quantity = Number(li?.quantity);
      const unit_price = Number(li?.unit_price);
      const tax_rate = Number(li?.tax_rate);

      if (!description) throw new Error(`Line item ${idx + 1}: description is required`);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Line item ${idx + 1}: quantity must be > 0`);
      if (!Number.isFinite(unit_price) || unit_price < 0) throw new Error(`Line item ${idx + 1}: unit_price must be >= 0`);
      if (!Number.isFinite(tax_rate) || tax_rate < 0) throw new Error(`Line item ${idx + 1}: tax_rate must be >= 0`);

      // product_id can be null/undefined if user typed a custom line item
      const rawProduct = li?.product_id;
      let product_id = rawProduct ? String(rawProduct) : null;
      if (product_id === "undefined") product_id = null;

      // For inventory products, quantity must be an integer
      if (product_id) {
        if (!Number.isInteger(quantity)) {
          throw new Error(
            `Line item ${idx + 1}: quantity must be an integer for inventory products`
          );
        }
      }

      return { product_id, description, quantity, unit_price, tax_rate };
    });

    const subtotal = normalizedItems.reduce((acc, li) => acc + li.quantity * li.unit_price, 0);
    const tax_total = normalizedItems.reduce(
      (acc, li) => acc + li.quantity * li.unit_price * li.tax_rate,
      0
    );
    const total = subtotal + tax_total;

    // Generate invoice number via RPC
    const { data: invNo, error: invNoErr } = await supabase.rpc("next_invoice_number", {
      p_org_id: org.orgId,
    });

    if (invNoErr) {
      return NextResponse.json({ error: invNoErr.message }, { status: 500 });
    }

    let invoice_number: string;
    if (typeof invNo === "number") {
      invoice_number = `INV-${invNo.toString().padStart(5, "0")}`;
    } else if (typeof invNo === "string" && /^\d+$/.test(invNo)) {
      invoice_number = `INV-${Number(invNo).toString().padStart(5, "0")}`;
    } else if (typeof invNo === "string") {
      invoice_number = invNo;
    } else {
      invoice_number = `INV-${Date.now()}`;
    }
    const invoice_date = new Date().toISOString();

    // 1) Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        organization_id: org.orgId,
        client_id,
        invoice_number,
        invoice_date,
        subtotal,
        tax_total,
        total,
        status: "draft",
      })
      .select("id, invoice_number")
      .single();

    if (invoiceError) {
      console.error("Invoice insert error:", invoiceError);
      return NextResponse.json({ error: invoiceError.message }, { status: 500 });
    }

    // 2) Insert line items
    const lineItemsRows = normalizedItems.map((li) => ({
      invoice_id: invoice.id,
      product_id: li.product_id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      tax_rate: li.tax_rate,
      line_total: li.quantity * li.unit_price * (1 + li.tax_rate),
    }));

    const { error: itemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemsRows);

    if (itemsError) {
      console.error("Line items insert error:", itemsError);
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Inventory deduction (only for rows with product_id)
    try {
      for (const li of normalizedItems) {
        if (!li.product_id) continue;

        const qty = Number(li.quantity);

        const { error: invErr } = await supabase.rpc("decrement_inventory", {
          p_org_id: org.orgId,
          p_product_id: li.product_id,
          p_qty: qty,
        });

        if (invErr) {
          // rollback invoice + items if inventory fails
          await supabase.from("invoice_line_items").delete().eq("invoice_id", invoice.id);
          await supabase.from("invoices").delete().eq("id", invoice.id);

          return NextResponse.json({ error: invErr.message }, { status: 400 });
        }
      }
    } catch (e: any) {
      // rollback safety
      await supabase.from("invoice_line_items").delete().eq("invoice_id", invoice.id);
      await supabase.from("invoices").delete().eq("id", invoice.id);

      return NextResponse.json(
        { error: e?.message ?? "Inventory deduction failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ invoice_id: invoice.id }, { status: 201 });
  } catch (err: any) {
    console.error("Create invoice route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error" },
      { status: 400 }
    );
  }
}

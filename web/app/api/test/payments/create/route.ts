export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function POST(req: Request) {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok)
      return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();
    const body = await req.json();

    const { invoice_id, amount, payment_date, payment_method, reference_number, notes } = body;

    if (!invoice_id || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "invoice_id and amount are required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Verify invoice belongs to this org
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("id, total, status")
      .eq("id", invoice_id)
      .eq("organization_id", org.orgId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot record a payment on a cancelled invoice" },
        { status: 400 }
      );
    }

    // Overpayment protection: sum existing payments and compare
    const { data: existingPayments, error: paymentsErr } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoice_id);

    if (paymentsErr) {
      return NextResponse.json({ error: paymentsErr.message }, { status: 500 });
    }

    const alreadyPaid = (existingPayments ?? []).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const balance_due = Number(invoice.total) - alreadyPaid;

    if (parsedAmount > balance_due) {
      return NextResponse.json(
        {
          error: `Overpayment not allowed. Balance due is ${balance_due.toFixed(2)}, payment amount is ${parsedAmount.toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    // Insert payment
    const { error: payErr } = await supabase.from("payments").insert({
      organization_id: org.orgId,
      invoice_id,
      amount: parsedAmount,
      payment_date: payment_date || new Date().toISOString().slice(0, 10),
      payment_method: payment_method || null,
      reference_number: reference_number || null,
      notes: notes || null,
    });

    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 400 });
    }

    // Recalculate invoice status via DB function
    const { error: rpcErr } = await supabase.rpc("recalculate_invoice_status", {
      p_invoice_id: invoice_id,
    });

    if (rpcErr) {
      console.error("recalculate_invoice_status failed:", rpcErr.message);
      // Non-fatal — payment was recorded, status just may not update
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

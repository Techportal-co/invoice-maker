export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok)
      return NextResponse.json({ error: org.error }, { status: org.status });

    const { invoice_id } = await req.json();
    if (!invoice_id)
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });

    const supabase = createClient();

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, total, customer_id")
      .eq("id", invoice_id)
      .eq("organization_id", org.orgId)
      .single();

    if (!invoice)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("invoice_id", invoice_id);

    const paid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    const balance = Number(invoice.total) - paid;

    if (balance <= 0)
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Invoice ${invoice.invoice_number}` },
            unit_amount: Math.round(balance * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/success?invoice=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/cancel`,
      metadata: {
        invoice_id: invoice.id,
        org_id: org.orgId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

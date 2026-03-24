export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = (await headers()).get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const invoice_id = session.metadata?.invoice_id;
    const org_id     = session.metadata?.org_id;

    if (!invoice_id || !org_id) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const amount = (session.amount_total ?? 0) / 100;
    const supabase = createClient();

    const { error: payErr } = await supabase.from("payments").insert({
      organization_id:  org_id,
      invoice_id,
      amount,
      payment_date:     new Date().toISOString().slice(0, 10),
      payment_method:   "stripe",
      reference_number: session.id,
    });

    if (payErr) {
      console.error("Failed to record payment:", payErr.message);
      return NextResponse.json({ error: payErr.message }, { status: 500 });
    }

    await supabase.rpc("recalculate_invoice_status", { p_invoice_id: invoice_id });
  }

  return NextResponse.json({ received: true });
}

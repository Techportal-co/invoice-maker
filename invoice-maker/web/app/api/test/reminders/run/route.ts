export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function POST() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const org = await getOrgIdForRequest();
    if (!org.ok)
      return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();
    const resend = new Resend(apiKey);

    // Fetch overdue invoices eligible for reminder (deduped by 3-day window via RPC)
    const { data: overdue, error: overdueErr } = await supabase.rpc(
      "get_overdue_invoices",
      { p_org_id: org.orgId }
    );

    if (overdueErr) {
      return NextResponse.json({ error: overdueErr.message }, { status: 500 });
    }

    if (!overdue || overdue.length === 0) {
      return NextResponse.json({ sent: 0, message: "No overdue invoices" });
    }

    const fromAddress =
      process.env.REMINDER_FROM_EMAIL ?? "billing@yourdomain.com";

    const results: { invoice_number: string; status: "sent" | "failed"; error?: string }[] = [];

    for (const inv of overdue) {
      if (!inv.customer_email) {
        results.push({ invoice_number: inv.invoice_number, status: "failed", error: "No email on file" });
        continue;
      }

      try {
        await resend.emails.send({
          from: fromAddress,
          to: inv.customer_email,
          subject: `Reminder: Invoice ${inv.invoice_number} is overdue`,
          html: `
            <p>Dear ${inv.customer_name},</p>
            <p>This is a friendly reminder that invoice <strong>${inv.invoice_number}</strong> is overdue.</p>
            <p>Outstanding balance: <strong>$${Number(inv.balance).toFixed(2)}</strong></p>
            <p>Please arrange payment at your earliest convenience.</p>
            <p>If you have already sent payment, please disregard this notice.</p>
          `,
        });

        // Update tracking fields in parallel — last_reminder_sent_at directly, count via RPC
        await Promise.all([
          supabase
            .from("invoices")
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .eq("id", inv.invoice_id),
          supabase.rpc("increment_reminder_count", {
            p_invoice_id: inv.invoice_id,
          }),
        ]);

        results.push({ invoice_number: inv.invoice_number, status: "sent" });
      } catch (e: any) {
        // Per-invoice failure — continue processing remaining invoices
        results.push({
          invoice_number: inv.invoice_number,
          status: "failed",
          error: e?.message ?? "Unknown error",
        });
      }
    }

    const sent   = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({ sent, failed, results });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

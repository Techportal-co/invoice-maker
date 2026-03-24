export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const org = await getOrgIdForRequest();
    if (!org.ok)
      return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data: customer } = await supabase
      .from("customers")
      .select("name, email, billing_address, billing_city, billing_country")
      .eq("id", id)
      .eq("organization_id", org.orgId)
      .single();

    const { data: rows } = await supabase.rpc("get_customer_statement", {
      p_org_id: org.orgId,
      p_customer_id: id,
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([612, 792]);
    let y = 750;

    const draw = (text: string, size = 10, isBold = false, x = 50) => {
      page.drawText(text, { x, y, size, font: isBold ? bold : font });
      y -= size + 6;
    };

    const money = (n: any) => `$${Number(n ?? 0).toFixed(2)}`;

    // Header
    draw("CUSTOMER STATEMENT", 18, true);
    y -= 4;
    draw(`Customer: ${customer?.name ?? "-"}`, 12, true);
    draw(`Email: ${customer?.email ?? "-"}`);
    const addr = [customer?.billing_address, customer?.billing_city, customer?.billing_country]
      .filter(Boolean)
      .join(", ");
    if (addr) draw(`Address: ${addr}`);
    draw(`Generated: ${new Date().toLocaleDateString()}`);
    y -= 16;

    // Divider
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, opacity: 0.3 });
    y -= 14;

    // Column positions
    const col = { date: 50, type: 115, ref: 190, debit: 340, credit: 415, balance: 490 };

    // Table header row
    const headers: [string, number][] = [
      ["Date", col.date], ["Type", col.type], ["Reference", col.ref],
      ["Debit", col.debit], ["Credit", col.credit], ["Balance", col.balance],
    ];
    for (const [label, x] of headers) {
      page.drawText(label, { x, y, size: 9, font: bold });
    }
    y -= 12;
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, opacity: 0.3 });
    y -= 10;

    let balance = 0;

    for (const r of rows ?? []) {
      balance += (Number(r.debit) || 0) - (Number(r.credit) || 0);

      if (y < 60) {
        page = pdfDoc.addPage([612, 792]);
        y = 750;
      }

      page.drawText(r.date ? new Date(r.date).toLocaleDateString() : "", { x: col.date,    y, size: 9, font });
      page.drawText(r.type ?? "",                                          { x: col.type,    y, size: 9, font });
      page.drawText((r.reference ?? "").slice(0, 20),                     { x: col.ref,     y, size: 9, font });
      page.drawText(r.debit  ? money(r.debit)  : "—",                     { x: col.debit,   y, size: 9, font });
      page.drawText(r.credit ? money(r.credit) : "—",                     { x: col.credit,  y, size: 9, font });
      page.drawText(money(balance),                                        { x: col.balance, y, size: 9, font });

      y -= 14;
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 0.5, opacity: 0.3 });
    y -= 16;
    page.drawText(`Closing Balance: ${money(balance)}`, { x: 50, y, size: 12, font: bold });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=statement-${id}.pdf`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

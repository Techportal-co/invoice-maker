export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabaseAdmin";
import { getOrgIdForRequest } from "@/lib/org-server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const org = await getOrgIdForRequest();
    if (!org.ok) return NextResponse.json({ error: org.error }, { status: org.status });

    const supabase = createClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        status,
        subtotal,
        tax_total,
        total,
        created_at,
        customer:customers (
          id,
          name,
          email,
          phone,
          address,
          city,
          state,
          country,
          postal_code
        ),
        invoice_line_items (
          id,
          description,
          quantity,
          unit_price,
          tax_rate,
          line_total
        )
      `
      )
      .eq("id", params.id)
      .eq("organization_id", org.orgId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: error?.message ?? "Invoice not found" }, { status: 404 });
    }

    // --- Build PDF ---
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();

    const margin = 48;
    let y = height - margin;

    const drawText = (text: string, size = 11, bold = false) => {
      page.drawText(text, {
        x: margin,
        y,
        size,
        font: bold ? fontBold : font,
      });
      y -= size + 6;
    };

    const money = (n: any) => Number(n ?? 0).toFixed(2);
    const pct = (n: any) => (Number(n ?? 0) * 100).toFixed(2) + "%";

    drawText("INVOICE", 20, true);
    drawText(`Invoice #: ${invoice.invoice_number ?? invoice.id}`, 12, true);
    drawText(
      `Date: ${
        invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "-"
      }`
    );
    y -= 10;

    // Customer block
    drawText("Bill To", 12, true);
    drawText(invoice.customer?.name ?? "-");
    if (invoice.customer?.email) drawText(invoice.customer.email);
    if (invoice.customer?.phone) drawText(invoice.customer.phone);

    const addrParts = [
      invoice.customer?.address,
      [invoice.customer?.city, invoice.customer?.state].filter(Boolean).join(", "),
      [invoice.customer?.country, invoice.customer?.postal_code].filter(Boolean).join(" "),
    ].filter(Boolean);

    for (const line of addrParts) drawText(String(line));

    y -= 12;

    // Table header
    const colX = {
      desc: margin,
      qty: 380,
      price: 430,
      tax: 495,
      total: 540,
    };

    page.drawText("Description", { x: colX.desc, y, size: 11, font: fontBold });
    page.drawText("Qty", { x: colX.qty, y, size: 11, font: fontBold });
    page.drawText("Price", { x: colX.price, y, size: 11, font: fontBold });
    page.drawText("Tax", { x: colX.tax, y, size: 11, font: fontBold });
    page.drawText("Total", { x: colX.total, y, size: 11, font: fontBold });
    y -= 16;

    // Divider
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
    });
    y -= 12;

    // Line items
    for (const li of invoice.invoice_line_items ?? []) {
      const desc = String(li.description ?? "");
      const qty = String(li.quantity ?? "");
      const price = money(li.unit_price);
      const taxRate = pct(li.tax_rate);
      const lineTotal = money(li.line_total);

      // simple wrap (one extra line max)
      const maxChars = 55;
      const desc1 = desc.length > maxChars ? desc.slice(0, maxChars) : desc;
      const desc2 = desc.length > maxChars ? desc.slice(maxChars, maxChars * 2) : "";

      page.drawText(desc1, { x: colX.desc, y, size: 10, font });
      page.drawText(qty, { x: colX.qty, y, size: 10, font });
      page.drawText(price, { x: colX.price, y, size: 10, font });
      page.drawText(taxRate, { x: colX.tax, y, size: 10, font });
      page.drawText(lineTotal, { x: colX.total, y, size: 10, font });
      y -= 14;

      if (desc2) {
        page.drawText(desc2, { x: colX.desc, y, size: 10, font });
        y -= 14;
      }

      if (y < margin + 120) {
        // (Simple version) stop before overflow
        page.drawText("…continued", { x: margin, y, size: 10, font });
        break;
      }
    }

    y -= 18;

    // Totals
    const totalsX = 420;
    const drawRight = (label: string, value: string) => {
      page.drawText(label, { x: totalsX, y, size: 11, font });
      page.drawText(value, { x: totalsX + 120, y, size: 11, font: fontBold });
      y -= 16;
    };

    drawRight("Subtotal:", money(invoice.subtotal));
    drawRight("Tax:", money(invoice.tax_total));
    drawRight("Total:", money(invoice.total));

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number ?? invoice.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

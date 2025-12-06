// web/app/invoices/[id]/page.tsx
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // fetch via internal API route
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/invoices/${id}`, {
    // Note: this absolute URL will call your deployment. In dev, better to call the internal route:
    // const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/invoices/${id}`)
    // But we'll call relative in dev:
    cache: "no-store",
    // alternatively, you can import supabaseAdmin and query directly (safer / faster)
  });

  // If you prefer direct DB call, uncomment the block below and import supabaseAdmin:
  // import { supabaseAdmin } from "@/lib/supabaseAdmin";
  // const { data, error } = await supabaseAdmin.from("invoices").select("*, invoice_line_items(*), clients(*)").eq("id", id).single();

  if (!res.ok) return notFound();
  const json = await res.json();
  const invoice = json.data;

  if (!invoice) return notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Invoice {invoice.id}</h1>
      <p className="text-gray-600 mb-8">View invoice details</p>

      <div className="bg-white p-6 rounded-xl border mb-10">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-600">Client</p>
            <p className="text-lg font-semibold">{invoice.clients?.name ?? invoice.client_id}</p>

            <p className="text-gray-600 mt-4">Invoice Date</p>
            <p className="font-medium">{invoice.invoice_date}</p>
          </div>

          <div className="text-right">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${invoice.status === "paid" ? "bg-green-100 text-green-700" : invoice.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
              {invoice.status}
            </div>

            <p className="text-gray-600 mt-4">Amount</p>
            <p className="text-2xl font-bold">${invoice.total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-xl font-semibold mb-4">Line Items</h2>
        <div className="space-y-4">
          {invoice.invoice_line_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <p className="font-semibold">{item.description}</p>
                <p className="text-gray-600 text-sm">Qty: {item.quantity} × ${item.unit_price}</p>
              </div>
              <p className="font-semibold text-lg">${item.line_total}</p>
            </div>
          ))}
        </div>
        <div className="text-right mt-6 text-2xl font-bold">Total: ${invoice.total}</div>
      </div>
    </div>
  );
}

import { getInvoiceById } from "@/lib/db/invoices";
import { notFound } from "next/navigation";

// ---- FIX: Add Types ---- //
interface InvoiceLineItem {
  id: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

interface Customer {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceDetail {
  id: string;
  invoice_number?: string | null;
  status: string;
  subtotal?: number;
  total: number;
  customer?: Customer | null;
  invoice_line_items?: InvoiceLineItem[];
}

// ------------------------- //

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice: InvoiceDetail | null = await getInvoiceById(params.id);

  if (!invoice) return notFound();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Invoice {invoice.invoice_number || invoice.id}
        </h1>
        <a
          href={`/api/test/invoices/${invoice.id}/pdf`}
          className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
        >
          Download PDF
        </a>
      </div>

      <div className="bg-white border p-4 rounded-xl">
        <p>
          <strong>Status:</strong> {invoice.status}
        </p>

        <p>
          <strong>Subtotal:</strong> ${invoice.subtotal?.toFixed(2) ?? "0.00"}
        </p>

        <p>
          <strong>Total:</strong> ${invoice.total?.toFixed(2) ?? "0.00"}
        </p>

        <p>
          <strong>Customer:</strong>{" "}
          {invoice.customer?.name ?? "Unknown Customer"}
          {invoice.customer?.email ? ` • ${invoice.customer.email}` : ""}
          {invoice.customer?.phone ? ` • ${invoice.customer.phone}` : ""}
        </p>

        {/* Line Items */}
        <h2 className="text-xl font-semibold mt-4">Line Items</h2>

        {invoice.invoice_line_items?.length ? (
          invoice.invoice_line_items.map((item: InvoiceLineItem) => (
            <div
              key={item.id}
              className="border p-3 rounded mb-2 bg-gray-50"
            >
              <p className="font-medium">{item.description}</p>
              <p className="text-gray-700">
                {item.quantity} × ${item.unit_price} ={" "}
                <strong>${item.line_total}</strong>
              </p>
            </div>
          ))
        ) : (
          <p>No line items found.</p>
        )}
      </div>
    </div>
  );
}

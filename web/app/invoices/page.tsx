"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Invoice = {
  id: string;
  invoice_number?: string | null;
  status: string;
  total: number;
  customer?: { id: string; name: string | null } | null;
};

type InvoiceDetail = {
  id: string;
  invoice_number?: string | null;
  status: string;
  subtotal?: number | null;
  tax_total?: number | null;
  total: number;
  created_at?: string | null;
  customer?: {
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
  } | null;
  invoice_line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
  }>;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<{ status: string; invoice_number: string }>({
    status: "",
    invoice_number: "",
  });
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await fetch("/api/test/invoices", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Failed to load invoices");
          setInvoices([]);
          return;
        }
        setInvoices(data?.invoices ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load invoices");
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onRefresh = () => startTransition(() => router.refresh());

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      const res = await fetch(`/api/test/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to delete invoice");
        return;
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete invoice");
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/test/invoices/${id}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.invoice) {
        setDetailError(data?.error ?? "Failed to load invoice");
        setDetail(null);
      } else {
        setDetail(data.invoice);
      }
    } catch (e: any) {
      setDetailError(e?.message ?? "Failed to load invoice");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setForm({
      status: invoice.status ?? "",
      invoice_number: invoice.invoice_number ?? "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({ status: "", invoice_number: "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.status.trim()) {
      alert("Status is required");
      return;
    }
    try {
      const res = await fetch(`/api/test/invoices/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status.trim(),
          invoice_number: form.invoice_number.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to update invoice");
        return;
      }
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editing.id
            ? {
                ...inv,
                status: form.status.trim(),
                invoice_number: form.invoice_number.trim() || inv.invoice_number,
              }
            : inv
        )
      );
      closeEdit();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update invoice");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="text-sm text-gray-600 border px-3 py-1 rounded hover:bg-gray-50"
            disabled={isPending}
          >
            {isPending ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/invoices/create"
            className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
          >
            + Create Invoice
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading...</p>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices found.</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const statusLower = (invoice.status || "").toLowerCase();
              const isActive = !["draft", "void", "cancelled"].includes(statusLower);
              const statusLabel = isActive ? "Active" : "Inactive";

              return (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium hover:underline"
                    >
                      {invoice.invoice_number || invoice.id}
                    </Link>
                    <span className="text-sm text-gray-600">
                      {invoice.customer?.name ?? "Unknown Customer"}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded border ${
                      isActive
                        ? "text-green-700 border-green-200 bg-green-50"
                        : "text-gray-700 border-gray-200 bg-gray-50"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  <span>${invoice.total}</span>
                  <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-700 underline"
                    onClick={() => openDetail(invoice.id)}
                  >
                    View
                  </button>
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => openEdit(invoice)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleDelete(invoice.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Invoice {detail.invoice_number || detail.id}
                </h2>
                <p className="text-sm text-gray-600">
                  {detail.created_at
                    ? new Date(detail.created_at).toLocaleString()
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/test/invoices/${detail.id}/pdf`}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
                >
                  Print / PDF
                </a>
                <button
                  className="px-4 py-2 rounded border text-sm"
                  onClick={closeDetail}
                >
                  Close
                </button>
              </div>
            </div>

            {detailError && (
              <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
                {detailError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Status:</span> {detail.status}
                </p>
                <p>
                  <span className="font-semibold">Subtotal:</span>{" "}
                  ${Number(detail.subtotal ?? 0).toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Tax:</span>{" "}
                  ${Number(detail.tax_total ?? 0).toFixed(2)}
                </p>
                <p>
                  <span className="font-semibold">Total:</span>{" "}
                  ${Number(detail.total ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Customer</p>
                <p>{detail.customer?.name ?? "Unknown Customer"}</p>
                {detail.customer?.email && <p>{detail.customer.email}</p>}
                {detail.customer?.phone && <p>{detail.customer.phone}</p>}
                {detail.customer && (
                  <p className="text-gray-700">
                    {[detail.customer.address, detail.customer.city, detail.customer.state]
                      .filter(Boolean)
                      .join(", ")}
                    {detail.customer.country || detail.customer.postal_code
                      ? ` ${[detail.customer.country, detail.customer.postal_code]
                          .filter(Boolean)
                          .join(" ")}`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Line Items</h3>
              {detail.invoice_line_items?.length ? (
                <div className="space-y-2">
                  {detail.invoice_line_items.map((li) => (
                    <div key={li.id} className="border rounded p-3 text-sm bg-gray-50">
                      <p className="font-medium">{li.description}</p>
                      <p className="text-gray-700">
                        Qty: {li.quantity} | Unit: ${li.unit_price.toFixed(2)} | Tax:{" "}
                        {(li.tax_rate * 100).toFixed(2)}% | Line: $
                        {li.line_total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No line items.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {detailLoading && !detail && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow px-4 py-3 text-sm">Loading invoice…</div>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Edit Invoice</h2>
            <div className="space-y-3">
              <label className="text-sm space-y-1 block">
                <span className="font-medium">Invoice Number</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder={editing.invoice_number ?? ""}
                />
              </label>
              <label className="text-sm space-y-1 block">
                <span className="font-medium">Status*</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  placeholder="draft"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border text-sm" onClick={closeEdit}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-black text-white text-sm"
                onClick={saveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

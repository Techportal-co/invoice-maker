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
            {invoices.map((invoice) => (
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
                <span className="text-gray-600">{invoice.status}</span>
                <span>${invoice.total}</span>
                <div className="flex items-center gap-2">
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
            ))}
          </div>
        )}
      </div>
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

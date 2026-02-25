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

type Payment = {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string | null;
};

type InvoiceDetail = {
  id: string;
  invoice_number?: string | null;
  status: string;
  subtotal?: number | null;
  tax_total?: number | null;
  total: number;
  amount_paid: number;
  balance_due: number;
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
  payments?: Payment[];
};

type PaymentForm = {
  amount: string;
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "text-gray-600 border-gray-200 bg-gray-50",
  sent: "text-blue-700 border-blue-200 bg-blue-50",
  partial: "text-yellow-700 border-yellow-200 bg-yellow-50",
  paid: "text-green-700 border-green-200 bg-green-50",
  cancelled: "text-red-700 border-red-200 bg-red-50",
};

function statusStyle(status: string) {
  return STATUS_STYLES[status?.toLowerCase()] ?? "text-gray-600 border-gray-200 bg-gray-50";
}

const today = new Date().toISOString().slice(0, 10);

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Detail modal
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Edit modal
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<{ status: string; invoice_number: string }>({
    status: "",
    invoice_number: "",
  });

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    amount: "",
    payment_date: today,
    payment_method: "",
    reference_number: "",
    notes: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
    setDetail(null);
    try {
      const res = await fetch(`/api/test/invoices/${id}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.invoice) {
        setDetailError(data?.error ?? "Failed to load invoice");
      } else {
        setDetail(data.invoice);
      }
    } catch (e: any) {
      setDetailError(e?.message ?? "Failed to load invoice");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
    setShowPaymentModal(false);
    setPaymentError(null);
  };

  const openEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setForm({ status: invoice.status ?? "", invoice_number: invoice.invoice_number ?? "" });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({ status: "", invoice_number: "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.status.trim()) { alert("Status is required"); return; }
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
      if (!res.ok) { alert(data?.error ?? "Failed to update invoice"); return; }
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editing.id
            ? { ...inv, status: form.status.trim(), invoice_number: form.invoice_number.trim() || inv.invoice_number }
            : inv
        )
      );
      closeEdit();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update invoice");
    }
  };

  const openPaymentModal = () => {
    setPaymentError(null);
    setPaymentForm({
      amount: detail?.balance_due ? String(Number(detail.balance_due).toFixed(2)) : "",
      payment_date: today,
      payment_method: "",
      reference_number: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!detail) return;
    setPaymentError(null);

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Amount must be a positive number.");
      return;
    }
    if (amount > Number(detail.balance_due)) {
      setPaymentError(
        `Amount exceeds balance due (${Number(detail.balance_due).toFixed(2)}). Overpayment is not allowed.`
      );
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await fetch("/api/test/payments/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: detail.id,
          amount,
          payment_date: paymentForm.payment_date || today,
          payment_method: paymentForm.payment_method || null,
          reference_number: paymentForm.reference_number || null,
          notes: paymentForm.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentError(data?.error ?? "Failed to record payment.");
        return;
      }

      // Close payment modal and refresh the detail + list
      setShowPaymentModal(false);
      await openDetail(detail.id);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === detail.id ? { ...inv, status: "partial" } : inv
        )
      );
      // Reload list to get accurate status
      const listRes = await fetch("/api/test/invoices", { cache: "no-store", credentials: "include" });
      if (listRes.ok) {
        const listData = await listRes.json();
        setInvoices(listData?.invoices ?? []);
      }
    } catch (e: any) {
      setPaymentError(e?.message ?? "Failed to record payment.");
    } finally {
      setPaymentSubmitting(false);
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
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>
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
                  <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                    {invoice.invoice_number || invoice.id}
                  </Link>
                  <span className="text-sm text-gray-600">
                    {invoice.customer?.name ?? "Unknown Customer"}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded border capitalize ${statusStyle(invoice.status)}`}>
                  {invoice.status}
                </span>
                <span className="text-sm font-medium">${Number(invoice.total).toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-gray-700 underline" onClick={() => openDetail(invoice.id)}>
                    View
                  </button>
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => openEdit(invoice)}>
                    Edit
                  </button>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(invoice.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-6 space-y-4">
            {detailLoading ? (
              <p className="text-sm text-gray-500 text-center py-8">Loading invoice…</p>
            ) : detail ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Invoice {detail.invoice_number || detail.id}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {detail.created_at ? new Date(detail.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {detail.balance_due > 0 && detail.status !== "cancelled" && (
                      <button
                        onClick={openPaymentModal}
                        className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium"
                      >
                        Record Payment
                      </button>
                    )}
                    <a
                      href={`/api/test/invoices/${detail.id}/pdf`}
                      className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
                    >
                      Print / PDF
                    </a>
                    <button className="px-4 py-2 rounded border text-sm" onClick={closeDetail}>
                      Close
                    </button>
                  </div>
                </div>

                {detailError && (
                  <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                    {detailError}
                  </div>
                )}

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize ${statusStyle(detail.status)}`}>
                        {detail.status}
                      </span>
                    </p>
                    <p><span className="font-semibold">Subtotal:</span> ${Number(detail.subtotal ?? 0).toFixed(2)}</p>
                    <p><span className="font-semibold">Tax:</span> ${Number(detail.tax_total ?? 0).toFixed(2)}</p>
                    <p><span className="font-semibold">Total:</span> ${Number(detail.total ?? 0).toFixed(2)}</p>
                    <p><span className="font-semibold">Amount Paid:</span> ${Number(detail.amount_paid ?? 0).toFixed(2)}</p>
                    <p className={detail.balance_due > 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                      Balance Due: ${Number(detail.balance_due ?? 0).toFixed(2)}
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
                          .filter(Boolean).join(", ")}
                        {detail.customer.country || detail.customer.postal_code
                          ? ` ${[detail.customer.country, detail.customer.postal_code].filter(Boolean).join(" ")}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-base font-semibold mb-2">Line Items</h3>
                  {detail.invoice_line_items?.length ? (
                    <div className="space-y-2">
                      {detail.invoice_line_items.map((li) => (
                        <div key={li.id} className="border rounded p-3 text-sm bg-gray-50">
                          <p className="font-medium">{li.description}</p>
                          <p className="text-gray-600">
                            Qty: {li.quantity} · Unit: ${Number(li.unit_price).toFixed(2)} · Tax:{" "}
                            {(li.tax_rate * 100).toFixed(0)}% · Line Total: $
                            {Number(li.line_total).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No line items.</p>
                  )}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="text-base font-semibold mb-2">Payment History</h3>
                  {detail.payments?.length ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Method</th>
                            <th className="px-3 py-2 text-left">Reference</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.payments.map((p) => (
                            <tr key={p.id} className="border-t">
                              <td className="px-3 py-2">
                                {p.payment_date
                                  ? new Date(p.payment_date).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 capitalize">{p.payment_method || "—"}</td>
                              <td className="px-3 py-2">{p.reference_number || "—"}</td>
                              <td className="px-3 py-2 text-right font-medium">
                                ${Number(p.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No payments recorded yet.</p>
                  )}
                </div>
              </>
            ) : (
              detailError && (
                <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                  {detailError}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && detail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <p className="text-sm text-gray-500">
                Balance due: <span className="font-semibold text-red-600">${Number(detail.balance_due).toFixed(2)}</span>
              </p>
            </div>

            {paymentError && (
              <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                {paymentError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="border rounded-md px-3 py-2 w-full"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Payment Date *</label>
                <input
                  type="date"
                  className="border rounded-md px-3 py-2 w-full"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Method</label>
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="">Select method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Reference Number</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                  placeholder="Transaction ID, cheque no., etc."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full min-h-[70px]"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                className="px-4 py-2 rounded border text-sm"
                onClick={() => { setShowPaymentModal(false); setPaymentError(null); }}
                disabled={paymentSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium disabled:opacity-60"
                onClick={handleRecordPayment}
                disabled={paymentSubmitting}
              >
                {paymentSubmitting ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
                <span className="font-medium">Status *</span>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border text-sm" onClick={closeEdit}>Cancel</button>
              <button className="px-4 py-2 rounded bg-black text-white text-sm" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PayInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [paying,  setPaying]    = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/test/invoices/${id}`, { credentials: "include", cache: "no-store" })
      .then(r => r.json())
      .then(d => { setInvoice(d); setLoading(false); })
      .catch(() => { setError("Failed to load invoice"); setLoading(false); });
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const res  = await fetch("/api/test/payments/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ invoice_id: id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create checkout"); return; }
      if (data.url) window.location.href = data.url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-gray-500">Loading invoice…</div>;

  if (error && !invoice) return (
    <div className="p-8 text-sm text-red-600">{error}</div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice?.invoice_number}</h1>
          <p className="text-sm text-gray-500 mt-1">Secure payment powered by Stripe</p>
        </div>

        <div className="border rounded-lg divide-y text-sm">
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Status</span>
            <span className="font-medium capitalize">{invoice?.status}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Subtotal</span>
            <span>${Number(invoice?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Tax</span>
            <span>${Number(invoice?.tax_total ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 font-semibold">
            <span>Total Due</span>
            <span>${Number(invoice?.total ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={paying || invoice?.status === "paid"}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {paying ? "Redirecting…" : invoice?.status === "paid" ? "Already Paid" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

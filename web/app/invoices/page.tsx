"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

type Invoice = {
  id: string;
  client_id?: string;
  clients?: { name?: string } | null;
  total?: number;
  invoice_date?: string;
  status?: string;
};

export default function InvoicesPageClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [per] = useState(6);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("invoice_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchInvoices();
  }, [page, sortField, sortOrder]);

  async function fetchInvoices() {
    const res = await fetch(`/api/invoices?page=${page}&per=${per}&sort=${sortField}&order=${sortOrder}`);
    const json = await res.json();
    setInvoices(json.data ?? []);
    setTotal(json.total ?? 0);
  }

  const totalPages = Math.max(1, Math.ceil(total / per));

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    paid: <CheckCircle size={18} className="text-green-700" />,
    pending: <Clock size={18} className="text-yellow-700" />,
    overdue: <AlertTriangle size={18} className="text-red-700" />,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Link href="/invoices/new" className="bg-blue-600 text-white px-5 py-2 rounded-lg">+ New Invoice</Link>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={() => { setSortField("invoice_date"); setSortOrder((o) => o === "asc" ? "desc" : "asc"); }} className="border px-3 py-1 rounded">Sort by Date</button>
        <button onClick={() => { setSortField("total"); setSortOrder((o) => o === "asc" ? "desc" : "asc"); }} className="border px-3 py-1 rounded">Sort by Amount</button>
        <button onClick={() => { setSortField("status"); setSortOrder((o) => o === "asc" ? "desc" : "asc"); }} className="border px-3 py-1 rounded">Sort by Status</button>
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
            <div>
              <p className="font-semibold">{inv.id}</p>
              <p className="text-gray-500">{inv.clients?.name ?? inv.client_id}</p>
            </div>

            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[inv.status ?? "pending"]}`}>
              {statusIcons[inv.status ?? "pending"]}
              {inv.status ?? "pending"}
            </span>

            <div className="text-right">
              <p className="font-semibold">${(inv.total ?? 0).toFixed(2)}</p>
              <p className="text-gray-500 text-sm">{inv.invoice_date}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
        <div>Page {page} / {totalPages}</div>
        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

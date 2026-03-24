"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface StatementRow {
  date: string;
  type: string;
  reference: string | null;
  debit: number;
  credit: number;
}

export default function CustomerStatementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rows, setRows]       = useState<StatementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res  = await fetch(`/api/test/customers/${id}/statement`, {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) { setError(json?.error ?? "Failed to load statement"); return; }
        setRows(json.statement ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load statement");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Compute running balance inline during render
  let runningBalance = 0;

  const totalDebit  = rows.reduce((s, r) => s + Number(r.debit  ?? 0), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit ?? 0), 0);
  const closingBalance = totalDebit - totalCredit;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customer Statement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Account activity — invoices and payments</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/test/customers/${id}/statement/pdf`}
            className="text-sm px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800"
          >
            Download PDF
          </a>
          <button
            onClick={() => router.back()}
            className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
      </div>

      {loading && (
        <div className="border rounded-lg p-6 text-sm text-gray-500 animate-pulse">
          Loading statement…
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="border rounded-lg p-6 text-sm text-gray-500">
          No transactions found for this customer.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          {/* Ledger Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  runningBalance += Number(r.debit ?? 0) - Number(r.credit ?? 0);
                  const isInvoice = r.type === "Invoice";
                  return (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isInvoice
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {r.reference ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.debit) > 0 ? (
                          <span className="text-gray-900">${Number(r.debit).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.credit) > 0 ? (
                          <span className="text-green-700">${Number(r.credit).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={runningBalance > 0 ? "text-red-600" : "text-green-700"}>
                          ${runningBalance.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Summary footer */}
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-sm font-semibold">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-gray-600">
                    Totals
                  </td>
                  <td className="px-4 py-3 text-right">${totalDebit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-700">${totalCredit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={closingBalance > 0 ? "text-red-600" : "text-green-700"}>
                      ${closingBalance.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Closing balance callout */}
          <div
            className={`flex items-center justify-between border rounded-lg px-5 py-4 ${
              closingBalance > 0
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }`}
          >
            <span className="text-sm font-medium text-gray-700">
              {closingBalance > 0 ? "Outstanding Balance" : "Credit Balance"}
            </span>
            <span
              className={`text-xl font-bold ${
                closingBalance > 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              ${Math.abs(closingBalance).toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

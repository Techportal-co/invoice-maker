import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/invoices/create"
          className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
        >
          + Create Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-bold">0.00</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Invoices</div>
          <div className="text-2xl font-bold">0</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Customers</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-sm text-gray-700">
        No data yet. Create your first invoice to see analytics here.
      </div>
    </div>
  );
}

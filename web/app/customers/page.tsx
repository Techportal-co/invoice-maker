"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  organization_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string | null;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  billing_address: string;
  shipping_address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_id: string;
  notes: string;
  is_active: boolean;
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await fetch("/api/test/customers", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Failed to load customers");
          setCustomers([]);
          return;
        }
        setCustomers(data.customers ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load customers");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    try {
      const res = await fetch(`/api/test/customers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to delete customer");
        return;
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete customer");
    }
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      website: customer.website ?? "",
      address: (customer as any).address ?? "",
      billing_address: (customer as any).billing_address ?? (customer as any).address ?? "",
      shipping_address: (customer as any).shipping_address ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      country: customer.country ?? "",
      postal_code: (customer as any).postal_code ?? "",
      tax_id: (customer as any).tax_id ?? "",
      notes: (customer as any).notes ?? "",
      is_active: customer.is_active ?? true,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const saveEdit = async () => {
    if (!editing || !form) return;
    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      billing_address: form.billing_address.trim() || null,
      shipping_address: form.shipping_address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      country: form.country.trim() || null,
      postal_code: form.postal_code.trim() || null,
      tax_id: form.tax_id.trim() || null,
      notes: form.notes.trim() || null,
      is_active: !!form.is_active,
    };

    try {
      const res = await fetch(`/api/test/customers/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to update customer");
        return;
      }
      setCustomers((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c))
      );
      closeEdit();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update customer");
    }
  };

  const onRefresh = () => startTransition(() => router.refresh());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="text-sm text-gray-600 border px-3 py-1 rounded hover:bg-gray-50"
            disabled={isPending}
          >
            {isPending ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/customers/create"
            className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
          >
            + Create Customer
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="border rounded-lg p-6 text-sm text-gray-700">Loading...</div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="border rounded-lg p-6 text-sm text-gray-700">
          No customers found. Create your first customer to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Customer Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Billing Address</th>
                <th className="px-3 py-2 text-left">Shipping Address</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c, idx) => {
                const location = c.billing_address || [c.city, c.state, c.country].filter(Boolean).join(", ");
                const shipping = c.shipping_address || "-";
                const displayId = `CUST-${String(idx + 1).padStart(4, "0")}`;

                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">{displayId}</td>
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.email ?? "-"}</td>
                    <td className="px-3 py-2">{c.phone ?? "-"}</td>
                    <td className="px-3 py-2">{location || "-"}</td>
                    <td className="px-3 py-2">{shipping}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs px-2 py-1 rounded border">
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {editing && form && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-6 space-y-4">
            <h2 className="text-xl font-semibold">Edit Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm space-y-1">
                <span className="font-medium">Name*</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Email</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Phone</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Website</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1 md:col-span-2">
                <span className="font-medium">Billing Address</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1 md:col-span-2">
                <span className="font-medium">Shipping Address</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">City</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">State</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Country</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Postal Code</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Tax ID</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1 md:col-span-2">
                <span className="font-medium">Notes</span>
                <textarea
                  className="border rounded px-3 py-2 w-full min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border text-sm"
                onClick={closeEdit}
              >
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

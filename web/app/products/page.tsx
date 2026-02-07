"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  product_number?: string | null;
  product_group?: string | null;
  sku: string | null;
  category: string | null;
  unit?: string | null;
  unit_price: number; // treated as sales price
  tax_type?: string | null;
  reorder_level: number;
  is_service?: boolean;
  is_active: boolean;
  created_at: string | null;
};

type ProductForm = {
  name: string;
  product_number: string;
  product_group: string;
  description: string;
  sku: string;
  category: string;
  unit: string;
  unit_price: string; // sales price
  tax_type: string;
  reorder_level: string;
  is_service: boolean;
  is_active: boolean;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await fetch("/api/test/products", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "Failed to load products");
          setProducts([]);
          return;
        }
        setProducts(data.products ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/test/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to delete product");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Failed to delete product");
    }
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name ?? "",
      product_number: (product as any).product_number ?? "",
      product_group: (product as any).product_group ?? "",
      description: (product as any).description ?? "",
      sku: product.sku ?? "",
      category: product.category ?? "",
      unit: (product as any).unit ?? "",
      unit_price: String(product.unit_price ?? ""),
      tax_type: (product as any).tax_type ?? "",
      reorder_level: String(product.reorder_level ?? ""),
      is_service: (product as any).is_service ?? false,
      is_active: product.is_active ?? true,
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

    const unit_price = Number(form.unit_price);
    const reorder_level = Number(form.reorder_level);

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      alert("Sales price must be a number >= 0");
      return;
    }
    if (!Number.isFinite(reorder_level) || reorder_level < 0) {
      alert("Reorder level must be a number >= 0");
      return;
    }

    const payload = {
      name: form.name.trim(),
      product_number: form.product_number.trim() || null,
      product_group: form.product_group.trim() || null,
      description: form.description.trim() || null,
      sku: form.sku.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit.trim() || null,
      unit_price,
      tax_type: form.tax_type.trim() || null,
      quantity_on_hand: 0,
      reorder_level,
      is_service: !!form.is_service,
      is_active: !!form.is_active,
    };

    try {
      const res = await fetch(`/api/test/products/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to update product");
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p))
      );
      closeEdit();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update product");
    }
  };

  const onRefresh = () => startTransition(() => router.refresh());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="text-sm text-gray-600 border px-3 py-1 rounded hover:bg-gray-50"
            disabled={isPending}
          >
            {isPending ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/products/create"
            className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium"
          >
            + Create Product
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="border rounded-lg p-6 text-sm text-gray-700">Loading...</div>
      ) : error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="border rounded-lg p-6 text-sm text-gray-700">
          No products found. Create your first product to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Product #</th>
                <th className="px-3 py-2 text-left">Product Group</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Sales Price</th>
                <th className="px-3 py-2 text-left">Tax Type</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{(p as any).product_number ?? "-"}</td>
                  <td className="px-3 py-2">{(p as any).product_group ?? "-"}</td>
                  <td className="px-3 py-2">{p.sku ?? "-"}</td>
                  <td className="px-3 py-2">{p.category ?? "-"}</td>
                  <td className="px-3 py-2">{(p as any).unit ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(p.unit_price).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">{(p as any).tax_type || "-"}</td>
                  <td className="px-3 py-2">
                    {(p as any).is_service ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-1 rounded border">
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button
                      className="text-xs text-blue-600 hover:underline"
                        onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && form && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto p-6 space-y-4">
            <h2 className="text-xl font-semibold">Edit Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm space-y-1">
                <span className="font-medium">Name*</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form!, name: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Product Number</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.product_number}
                  onChange={(e) => setForm({ ...form!, product_number: e.target.value })}
                  placeholder="Internal ref"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Product Group</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.product_group}
                  onChange={(e) => setForm({ ...form!, product_group: e.target.value })}
                  placeholder="Group / collection"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Unit of Measure</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form!, unit: e.target.value })}
                  placeholder="e.g., pcs, kg, hr"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">SKU</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form!, sku: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Category</span>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form!, category: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1 md:col-span-2">
                <span className="font-medium">Description</span>
                <textarea
                  className="border rounded px-3 py-2 w-full min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form!, description: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Sales Price</span>
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-3 py-2 w-full"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form!, unit_price: e.target.value })}
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Tax Type</span>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={form.tax_type}
                  onChange={(e) => setForm({ ...form!, tax_type: e.target.value })}
                >
                  <option value="">Select tax type</option>
                  <option value="standard">Standard</option>
                  <option value="reduced">Reduced</option>
                  <option value="zero">Zero</option>
                  <option value="exempt">Exempt</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.is_service}
                  onChange={(e) => setForm({ ...form!, is_service: e.target.checked })}
                />
                Service Item
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Quantity On Hand</span>
                <input
                  type="number"
                  step="1"
                  className="border rounded px-3 py-2 w-full"
                  value={form.quantity_on_hand}
                  onChange={(e) =>
                    setForm({ ...form!, quantity_on_hand: e.target.value })
                  }
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="font-medium">Reorder Level</span>
                <input
                  type="number"
                  step="1"
                  className="border rounded px-3 py-2 w-full"
                  value={form.reorder_level}
                  onChange={(e) => setForm({ ...form!, reorder_level: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form!, is_active: e.target.checked })}
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

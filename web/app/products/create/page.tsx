"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    unit_price: "0", // sales price
    tax_rate_percent: "0", // user enters % in UI
    quantity_on_hand: "0",
    reorder_level: "0",
    is_active: true,
  });

  const setValue = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = form.name.trim();
    if (!name) {
      setErrorMsg("Name is required.");
      return;
    }

    const unit_price = Number(form.unit_price);
    const tax_rate = Number(form.tax_rate_percent) / 100;
    const quantity_on_hand = Number(form.quantity_on_hand);
    const reorder_level = Number(form.reorder_level);

    if (!Number.isFinite(unit_price) || unit_price < 0) {
      setErrorMsg("Sales price must be a number >= 0.");
      return;
    }
    if (!Number.isFinite(tax_rate) || tax_rate < 0) {
      setErrorMsg("Tax rate must be a number >= 0.");
      return;
    }
    if (!Number.isFinite(quantity_on_hand) || quantity_on_hand < 0) {
      setErrorMsg("Quantity on hand must be a number >= 0.");
      return;
    }
    if (!Number.isFinite(reorder_level) || reorder_level < 0) {
      setErrorMsg("Reorder level must be a number >= 0.");
      return;
    }

    const payload: Record<string, any> = {
      name,
      unit_price,
      tax_rate,
      quantity_on_hand,
      reorder_level,
      is_active: form.is_active,
    };

    const optionalText = ["description", "sku", "category"] as const;
    for (const key of optionalText) {
      const v = form[key].trim();
      if (v !== "") payload[key] = v;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/test/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error ?? "Failed to create product.");
        setIsSubmitting(false);
        return;
      }

      router.push("/products");
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error creating product.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Product</h1>

      {errorMsg && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.name}
              onChange={(e) => setValue("name", e.target.value)}
              placeholder="Website Design"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="border rounded-md px-3 py-2 w-full min-h-[90px]"
              value={form.description}
              onChange={(e) => setValue("description", e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">SKU</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.sku}
              onChange={(e) => setValue("sku", e.target.value)}
              placeholder="WEB-001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.category}
              onChange={(e) => setValue("category", e.target.value)}
              placeholder="Services"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Sales Price</label>
            <input
              type="number"
              step="0.01"
              className="border rounded-md px-3 py-2 w-full"
              value={form.unit_price}
              onChange={(e) => setValue("unit_price", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              className="border rounded-md px-3 py-2 w-full"
              value={form.tax_rate_percent}
              onChange={(e) => setValue("tax_rate_percent", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Quantity On Hand</label>
            <input
              type="number"
              step="1"
              className="border rounded-md px-3 py-2 w-full"
              value={form.quantity_on_hand}
              onChange={(e) => setValue("quantity_on_hand", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Reorder Level</label>
            <input
              type="number"
              step="1"
              className="border rounded-md px-3 py-2 w-full"
              value={form.reorder_level}
              onChange={(e) => setValue("reorder_level", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setValue("is_active", e.target.checked)}
            />
            <span className="text-sm text-gray-700">Active</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium disabled:opacity-60"
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-500">
        organization_id will be automatically assigned once we resume Step 7 (Organizations).
      </div>
    </div>
  );
}

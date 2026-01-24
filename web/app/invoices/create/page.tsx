"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit_price: number;
  tax_rate: number;
}

interface Customer {
  id: string;
  name: string;
}

interface LineItem {
  id: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number; // 0.05 = 5%
  line_total: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      product_id: null,
      description: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      line_total: 0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch customers + products
  useEffect(() => {
    const fetchData = async () => {
      setLoadError(null);

      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/test/customers", { cache: "no-store" }),
          fetch("/api/test/products", { cache: "no-store" }),
        ]);

        const customersText = await customersRes.text();
        const productsText = await productsRes.text();

        if (!customersRes.ok) {
          console.error("Customers API failed:", customersText);
          setLoadError(
            (prev) => (prev ? prev + " | " : "") + `Customers: ${customersText}`
          );
        } else {
          const data = JSON.parse(customersText);
          setCustomers(data.customers ?? []);
        }

        if (!productsRes.ok) {
          console.error("Products API failed:", productsText);
          setLoadError(
            (prev) => (prev ? prev + " | " : "") + `Products: ${productsText}`
          );
        } else {
          const data = JSON.parse(productsText);
          setProducts(data.products ?? []);
        }
      } catch (e: any) {
        console.error("Fetch crashed:", e);
        setLoadError(e?.message ?? "Fetch crashed");
      }
    };

    fetchData();
  }, []);

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };
        const base = updated.quantity * updated.unit_price;
        const tax = base * updated.tax_rate;

        return { ...updated, line_total: base + tax };
      })
    );
  };

  const handleProductChange = (lineId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    updateLineItem(lineId, {
      product_id: product.id,
      description: product.description || product.name,
      unit_price: product.unit_price,
      tax_rate: product.tax_rate,
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product_id: null,
        description: "",
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        line_total: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const subtotal = useMemo(
    () => lineItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0),
    [lineItems]
  );

  const totalTax = useMemo(
    () =>
      lineItems.reduce(
        (acc, item) => acc + item.quantity * item.unit_price * item.tax_rate,
        0
      ),
    [lineItems]
  );

  const grandTotal = subtotal + totalTax;

  const onSubmit = async () => {
    setErrorMsg(null);

    if (!selectedCustomerId) {
      setErrorMsg("Please select a customer.");
      return;
    }

    const cleanedItems = lineItems
      .map((li) => ({
        product_id: li.product_id ?? null,
        description: li.description.trim(),
        quantity: li.quantity,
        unit_price: li.unit_price,
        tax_rate: li.tax_rate,
      }))
      .filter((li) => li.description.length > 0);

    if (cleanedItems.length === 0) {
      setErrorMsg("Please add at least one line item with a description.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/test/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          line_items: cleanedItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error ?? "Failed to create invoice.");
        setIsSubmitting(false);
        return;
      }

      router.push("/invoices");
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error creating invoice.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <div className="text-xs text-gray-500">
          Customers: {customers.length} • Products: {products.length}
        </div>
      </div>

      {loadError && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {loadError}
        </div>
      )}

      {errorMsg && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      {/* Customer */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer</label>
        <select
          className="border rounded-md px-3 py-2 w-full"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Line items */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Tax %</th>
              <th className="px-3 py-2 text-right">Line Total</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>

          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">
                  <select
                    className="border rounded-md px-2 py-1 w-full"
                    value={item.product_id ?? ""}
                    onChange={(e) => handleProductChange(item.id, e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.sku ? ` (${p.sku})` : ""}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2">
                  <input
                    className="border rounded-md px-2 py-1 w-full"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, { description: e.target.value })
                    }
                    placeholder="Description"
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={1}
                    className="border rounded-md px-2 py-1 w-20 text-right"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-md px-2 py-1 w-28 text-right"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        unit_price: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </td>

                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded-md px-2 py-1 w-20 text-right"
                    value={item.tax_rate * 100}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        tax_rate: Math.max(0, (Number(e.target.value) || 0) / 100),
                      })
                    }
                  />
                </td>

                <td className="px-3 py-2 text-right">{item.line_total.toFixed(2)}</td>

                <td className="px-3 py-2 text-right">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => removeLineItem(item.id)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-3 flex items-center justify-between">
          <button type="button" className="text-sm font-medium" onClick={addLineItem}>
            + Add line item
          </button>

          <div className="text-sm text-gray-700 space-x-6">
            <span>
              Subtotal: <b>{subtotal.toFixed(2)}</b>
            </span>
            <span>
              Tax: <b>{totalTax.toFixed(2)}</b>
            </span>
            <span>
              Total: <b className="text-lg">{grandTotal.toFixed(2)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Invoice"}
        </button>
      </div>
    </div>
  );
}

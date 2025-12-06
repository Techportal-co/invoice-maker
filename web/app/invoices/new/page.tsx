"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewInvoicePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    organization_id: "",
    client_id: "",
    invoice_date: "",
    due_date: "",
    status: "pending",
    currency: "USD",
    notes: "",
    terms_condition: "",
  });

  const [items, setItems] = useState([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  const handleItemChange = (i: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = value;
    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);

  const removeItem = (i: number) =>
    setItems(items.filter((_, index) => index !== i));

  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSubmit = async () => {
    const subtotal = calculateSubtotal();
    const tax_amount = 0;
    const discount_amount = 0;
    const total = subtotal;

    const payload = {
      ...form,
      subtotal,
      tax_amount,
      discount_amount,
      total,
      items,
    };

    const res = await fetch("/api/invoices/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/invoices");
    } else {
      alert("Error creating invoice");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>

      {/* INVOICE FORM */}
      <div className="space-y-4 bg-white p-6 rounded-lg border">

        <div>
          <label>Organization ID</label>
          <input
            value={form.organization_id}
            onChange={(e) =>
              setForm({ ...form, organization_id: e.target.value })
            }
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Client ID</label>
          <input
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Invoice Date</label>
          <input
            type="date"
            value={form.invoice_date}
            onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Due Date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        {/* ITEMS */}
        <h2 className="text-lg font-semibold mt-6">Line Items</h2>

        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-4 mb-4">

            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                handleItemChange(idx, "description", e.target.value)
              }
              className="border p-2 w-full mb-2"
            />

            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(idx, "quantity", Number(e.target.value))
                }
                className="border p-2"
              />

              <input
                type="number"
                placeholder="Unit Price"
                value={item.unit_price}
                onChange={(e) =>
                  handleItemChange(idx, "unit_price", Number(e.target.value))
                }
                className="border p-2"
              />
            </div>

            <button
              onClick={() => removeItem(idx)}
              className="text-red-500 mt-2"
            >
              Remove Item
            </button>
          </div>
        ))}

        <button onClick={addItem} className="text-blue-600">
          + Add Item
        </button>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-black text-white py-2 rounded-lg"
        >
          Create Invoice
        </button>
      </div>
    </div>
  );
}

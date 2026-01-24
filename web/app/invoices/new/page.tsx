"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/lib/db/createInvoice";
import { getCustomers } from "@/lib/db/customers";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // ---- CUSTOMERS ----
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      const data = await getCustomers();
      setCustomers(data?.customers || []);
    }
    loadCustomers();
  }, []);

  // ---- INVOICE FIELDS ----
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  // ---- LINE ITEMS ----
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0 },
  ]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0 },
    ]);
  };

  const updateLineItem = (index: number, key: string, value: any) => {
    const items = [...lineItems];
    (items as any)[index][key] = value;

    // recalc total for that row
    items[index].line_total =
      items[index].quantity * items[index].unit_price +
      (items[index].quantity *
        items[index].unit_price *
        items[index].tax_rate) /
        100;

    setLineItems(items);
  };

  // ---- TOTALS ----
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const total = subtotal; // (can expand later with tax/discount)

  // ---- SUBMIT ----
  const handleSubmit = async () => {
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    const payload = {
      organization_id: "ORG-ID-HERE", // TEMP until auth is implemented
      customer_id: customerId,
      invoice_maker: "Saif",
      invoice_date: invoiceDate,
      due_date: dueDate,
      status: "pending",
      subtotal,
      tax_amount: 0,
      discount_amount: 0,
      total,
      currency: "USD",
      notes,
      terms_condition: terms,
      line_items: lineItems,
    };

    const res = await createInvoice(payload);

    if (res?.invoice?.id) {
      router.push(`/invoices/${res.invoice.id}`);
    } else {
      alert("Error creating invoice.");
      console.log(res);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Invoice</h1>

      {/* ---- MAIN FORM CARD ---- */}
      <div className="bg-white border rounded-xl p-6 space-y-4">

        {/* CUSTOMER DROPDOWN */}
        <div>
          <label className="block mb-1 font-medium">Customer</label>
          <select
            className="border p-2 rounded w-full"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `(${c.email})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* DATES */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label>Invoice Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <label>Due Date</label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* ---- LINE ITEMS ---- */}
        <h2 className="text-xl font-semibold">Line Items</h2>

        {lineItems.map((item, index) => (
          <div key={index} className="border p-4 rounded-xl space-y-2">
            <input
              placeholder="Description"
              className="border p-2 rounded w-full"
              value={item.description}
              onChange={(e) =>
                updateLineItem(index, "description", e.target.value)
              }
            />

            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Qty"
                className="border p-2 rounded w-20"
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(index, "quantity", Number(e.target.value))
                }
              />
              <input
                type="number"
                placeholder="Unit Price"
                className="border p-2 rounded w-32"
                value={item.unit_price}
                onChange={(e) =>
                  updateLineItem(index, "unit_price", Number(e.target.value))
                }
              />
              <input
                type="number"
                placeholder="Tax %"
                className="border p-2 rounded w-20"
                value={item.tax_rate}
                onChange={(e) =>
                  updateLineItem(index, "tax_rate", Number(e.target.value))
                }
              />
            </div>

            <p>
              <strong>Line Total:</strong> ${item.line_total.toFixed(2)}
            </p>
          </div>
        ))}

        <button
          onClick={addLineItem}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          + Add Item
        </button>

        {/* TOTALS */}
        <h2 className="text-lg font-semibold mt-4">
          Subtotal: ${subtotal.toFixed(2)}
        </h2>

        <h2 className="text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </h2>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4"
        >
          Create Invoice
        </button>
      </div>
    </div>
  );
}

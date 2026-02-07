"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCustomerPage() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // We intentionally do NOT ask for:
  // id, created_at, updated_at
  // organization_id will be handled later in Step 7 (auth/orgs)
  const [form, setForm] = useState({
    name: "",
    contact_first_name: "",
    contact_last_name: "",
    email: "",
    phone: "",
    website: "",
    billing_address: "",
    billing_city: "",
    billing_state: "",
    billing_country: "",
    billing_postal_code: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_country: "",
    shipping_postal_code: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    tax_id: "",
    notes: "",
    is_active: true,
  });
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const setValue = (key: keyof typeof form, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (sameAsBilling && key.startsWith("billing_")) {
        const suffix = key.replace("billing_", "");
        const shipKey = `shipping_${suffix}` as keyof typeof form;
        if (shipKey in next) {
          (next as any)[shipKey] = value;
        }
      }
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = form.name.trim();
    if (!name) {
      setErrorMsg("Name is required.");
      return;
    }

    // Build payload; remove empty strings to keep DB clean
    const payload: Record<string, any> = {
      name,
      is_active: form.is_active,
    };

    const optionalKeys: (keyof typeof form)[] = [
      "contact_first_name",
      "contact_last_name",
      "email",
      "phone",
      "website",
      "billing_address",
      "billing_city",
      "billing_state",
      "billing_country",
      "billing_postal_code",
      "shipping_address",
      "shipping_city",
      "shipping_state",
      "shipping_country",
      "shipping_postal_code",
      "city",
      "state",
      "country",
      "postal_code",
      "tax_id",
      "notes",
    ];

    for (const k of optionalKeys) {
      const v = String(form[k] ?? "").trim();
      if (v !== "") payload[k] = v;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/test/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error ?? "Failed to create customer.");
        setIsSubmitting(false);
        return;
      }

      router.push("/customers");
    } catch (e) {
      console.error(e);
      setErrorMsg("Unexpected error creating customer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Customer</h1>

      {errorMsg && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.name}
              onChange={(e) => setValue("name", e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.email}
              onChange={(e) => setValue("email", e.target.value)}
              type="email"
              placeholder="billing@acme.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Contact First Name</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.contact_first_name}
              onChange={(e) => setValue("contact_first_name", e.target.value)}
              placeholder="Jane"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Contact Last Name</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.contact_last_name}
              onChange={(e) => setValue("contact_last_name", e.target.value)}
              placeholder="Doe"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Phone</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.phone}
              onChange={(e) => setValue("phone", e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Website</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.website}
              onChange={(e) => setValue("website", e.target.value)}
              placeholder="https://acme.com"
            />
          </div>

          <div className="md:col-span-2 border-t pt-4 space-y-2">
            <h2 className="text-base font-semibold">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full min-h-[80px]"
                  value={form.billing_address}
                  onChange={(e) => setValue("billing_address", e.target.value)}
                  placeholder="Billing / invoice address"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">City</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.billing_city}
                  onChange={(e) => setValue("billing_city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">State</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.billing_state}
                  onChange={(e) => setValue("billing_state", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Country</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.billing_country}
                  onChange={(e) => setValue("billing_country", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Postal Code</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.billing_postal_code}
                  onChange={(e) => setValue("billing_postal_code", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameAsBilling(checked);
                  if (checked) {
                    setForm((prev) => ({
                      ...prev,
                      shipping_address: prev.billing_address,
                      shipping_city: prev.billing_city,
                      shipping_state: prev.billing_state,
                      shipping_country: prev.billing_country,
                      shipping_postal_code: prev.billing_postal_code,
                    }));
                  }
                }}
              />
              <span className="text-sm text-gray-700">
                Billing address same as shipping address
              </span>
            </div>
            <h2 className="text-base font-semibold">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full min-h-[80px]"
                  value={form.shipping_address}
                  onChange={(e) => setValue("shipping_address", e.target.value)}
                  placeholder="Shipping address"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">City</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.shipping_city}
                  onChange={(e) => setValue("shipping_city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">State</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.shipping_state}
                  onChange={(e) => setValue("shipping_state", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Country</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.shipping_country}
                  onChange={(e) => setValue("shipping_country", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Postal Code</label>
                <input
                  className="border rounded-md px-3 py-2 w-full"
                  value={form.shipping_postal_code}
                  onChange={(e) => setValue("shipping_postal_code", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Tax ID</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={form.tax_id}
              onChange={(e) => setValue("tax_id", e.target.value)}
              placeholder="VAT / EIN / GST number"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="border rounded-md px-3 py-2 w-full min-h-[90px]"
              value={form.notes}
              onChange={(e) => setValue("notes", e.target.value)}
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
            {isSubmitting ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-500">
        organization_id will be automatically assigned once we resume Step 7 (Organizations).
      </div>
    </div>
  );
}

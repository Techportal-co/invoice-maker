"use client";

import { useEffect, useState } from "react";

type TaxType = "standard" | "reduced" | "zero" | "exempt";

type TaxRate = {
  id?: string;
  tax_type: TaxType;
  tax_rate: number;
};

const TAX_TYPE_LABELS: Record<TaxType, { label: string; description: string }> = {
  standard: { label: "Standard", description: "Full VAT/GST rate (e.g. 20% UK, 19% DE)" },
  reduced: { label: "Reduced", description: "Reduced rate for essentials (e.g. 5% UK, 7% DE)" },
  zero: { label: "Zero", description: "Zero-rated — taxable but at 0% (exports, etc.)" },
  exempt: { label: "Exempt", description: "Outside scope of VAT entirely" },
};

const ALL_TYPES: TaxType[] = ["standard", "reduced", "zero", "exempt"];

export default function TaxSettingsPage() {
  const [rates, setRates] = useState<Record<TaxType, string>>({
    standard: "",
    reduced: "",
    zero: "",
    exempt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<TaxType | null>(null);
  const [errors, setErrors] = useState<Record<TaxType, string | null>>({
    standard: null,
    reduced: null,
    zero: null,
    exempt: null,
  });
  const [successes, setSuccesses] = useState<Record<TaxType, boolean>>({
    standard: false,
    reduced: false,
    zero: false,
    exempt: false,
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/test/settings/tax", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data?.error ?? "Failed to load tax rates");
          return;
        }

        const fetched: Record<TaxType, string> = {
          standard: "",
          reduced: "",
          zero: "",
          exempt: "",
        };

        for (const row of data.tax_rates ?? []) {
          if (row.tax_type in fetched) {
            fetched[row.tax_type as TaxType] = String(
              (Number(row.tax_rate) * 100).toFixed(2)
            );
          }
        }

        setRates(fetched);
      } catch (e: any) {
        setLoadError(e?.message ?? "Failed to load tax rates");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async (tax_type: TaxType) => {
    const raw = rates[tax_type];
    const percent = parseFloat(raw);

    if (isNaN(percent) || percent < 0 || percent > 100) {
      setErrors((prev) => ({ ...prev, [tax_type]: "Enter a value between 0 and 100" }));
      return;
    }

    setErrors((prev) => ({ ...prev, [tax_type]: null }));
    setSuccesses((prev) => ({ ...prev, [tax_type]: false }));
    setSaving(tax_type);

    try {
      const res = await fetch("/api/test/settings/tax", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tax_type, tax_rate: percent / 100 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, [tax_type]: data?.error ?? "Failed to save" }));
      } else {
        setSuccesses((prev) => ({ ...prev, [tax_type]: true }));
        setTimeout(() => {
          setSuccesses((prev) => ({ ...prev, [tax_type]: false }));
        }, 2500);
      }
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [tax_type]: e?.message ?? "Failed to save" }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Tax Rates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your organization's tax rates. These are applied automatically
          when creating invoices based on each product's tax type.
        </p>
      </div>

      {loadError && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tax Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Rate (%)</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ALL_TYPES.map((type) => {
                const { label, description } = TAX_TYPE_LABELS[type];
                const isSaving = saving === type;
                const err = errors[type];
                const saved = successes[type];

                return (
                  <tr key={type} className="border-t">
                    <td className="px-4 py-3 font-medium">{label}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="border rounded px-2 py-1 w-24 text-right"
                          value={rates[type]}
                          onChange={(e) =>
                            setRates((prev) => ({ ...prev, [type]: e.target.value }))
                          }
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                      {err && (
                        <p className="text-red-600 text-xs mt-1 text-right">{err}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {saved ? (
                        <span className="text-xs text-green-600 font-medium">Saved</span>
                      ) : (
                        <button
                          onClick={() => handleSave(type)}
                          disabled={isSaving}
                          className="text-xs px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Rates are stored per organization and applied at invoice creation time.
        Existing invoices are not retroactively updated.
      </p>
    </div>
  );
}

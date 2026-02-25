import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="border rounded-lg divide-y">
        <Link
          href="/settings/tax"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition"
        >
          <div>
            <p className="font-medium text-sm">Tax Rates</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure standard, reduced, zero, and exempt rates for your organization
            </p>
          </div>
          <span className="text-gray-400 text-sm">›</span>
        </Link>
      </div>
    </div>
  );
}

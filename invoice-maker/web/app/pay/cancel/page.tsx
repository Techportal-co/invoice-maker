import Link from "next/link";

export default function PayCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm border p-10 w-full max-w-md text-center space-y-4">
        <div className="text-5xl">✕</div>
        <h1 className="text-2xl font-semibold text-gray-800">Payment Cancelled</h1>
        <p className="text-sm text-gray-500">
          Your payment was not completed. No charges were made.
        </p>
        <Link
          href="/invoices"
          className="inline-block mt-4 px-5 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Back to Invoices
        </Link>
      </div>
    </div>
  );
}

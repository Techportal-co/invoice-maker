import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_country?: string | null;
  billing_postal_code?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_country?: string | null;
  shipping_postal_code?: string | null;
  tax_id?: string | null;
  notes?: string | null;
  is_active?: boolean;
  created_at?: string | null;
};

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return envUrl?.replace(/\/$/, "") || "http://localhost:3000";
}

async function getCustomer(id: string): Promise<Customer | null> {
  const baseUrl = getBaseUrl();
  const init: RequestInit = { cache: "no-store" };
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader) init.headers = { cookie: cookieHeader };

  const res = await fetch(`${baseUrl}/api/test/customers/${id}`, init);
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data?.customer ?? null;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomer(params.id);
  if (!customer) return notFound();

  const addressBlock = (addr?: string | null, city?: string | null, state?: string | null, country?: string | null, postal?: string | null) => {
    const parts = [city, state].filter(Boolean).join(", ");
    const tail = [country, postal].filter(Boolean).join(" ");
    return (
      <>
        {addr && <div>{addr}</div>}
        {(parts || tail) && (
          <div>
            {[parts, tail].filter(Boolean).join(" ").trim()}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-gray-600">
            {customer.is_active ? "Active" : "Inactive"} •{" "}
            {customer.created_at
              ? new Date(customer.created_at).toLocaleDateString()
              : ""}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold">Contact</p>
            {customer.email && <p>{customer.email}</p>}
            {customer.phone && <p>{customer.phone}</p>}
            {customer.website && (
              <p className="text-blue-600">
                <a href={customer.website} target="_blank" rel="noreferrer">
                  {customer.website}
                </a>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-semibold">Tax / Notes</p>
            {customer.tax_id && <p>Tax ID: {customer.tax_id}</p>}
            {customer.notes && <p className="text-gray-700">{customer.notes}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold">Billing Address</p>
            {addressBlock(
              customer.billing_address,
              customer.billing_city,
              customer.billing_state,
              customer.billing_country,
              customer.billing_postal_code
            )}
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Shipping Address</p>
            {addressBlock(
              customer.shipping_address,
              customer.shipping_city,
              customer.shipping_state,
              customer.shipping_country,
              customer.shipping_postal_code
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

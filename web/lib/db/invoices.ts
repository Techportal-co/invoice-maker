import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Fetch paginated invoices
export async function getInvoices(page = 1, perPage = 10) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabaseAdmin
    .from("invoices")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching invoices:", error);
    return { data: [], total: 0 };
  }

  return {
    data,
    total: count || 0,
  };
}

export async function getInvoiceById(id: string) {
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If any error or no invoice, return null silently (404 will be handled by caller).
  if (invoiceError || !invoice) return null;

  // Fetch related customer (using client_id) and line items separately to avoid join issues.
  let customer = null;
  if ((invoice as any).client_id) {
    const { data: customerData } = await supabaseAdmin
      .from("customers")
      .select("id, name, email")
      .eq("id", (invoice as any).client_id)
      .maybeSingle();
    customer = customerData ?? null;
  }

  const { data: items } = await supabaseAdmin
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", id);

  return {
    ...invoice,
    customer,
    invoice_line_items: items ?? [],
  };
}

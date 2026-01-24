import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getInvoiceSettings(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("organization_id", orgId)
    .single();

  if (error) {
    console.error("Settings fetch error:", error);
    return null;
  }

  return data;
}

export async function incrementInvoiceNumber(orgId: string, nextNumber: number) {
  const { error } = await supabaseAdmin
    .from("settings")
    .update({ invoice_next_number: nextNumber })
    .eq("organization_id", orgId);

  if (error) {
    console.error("Update nextNumber error:", error);
  }
}

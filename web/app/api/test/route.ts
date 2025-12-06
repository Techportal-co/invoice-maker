import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("customers").select("*").limit(1);

  return Response.json({
    message: "Supabase connection works!",
    error,
    data,
  });
}

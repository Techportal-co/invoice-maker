export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const activeOrg = cookieStore.get("active_org_id")?.value ?? null;

  return NextResponse.json({
    user_id: data.user?.id ?? null,
    active_org_id: activeOrg,
  });
}

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestSupabasePage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    supabase.from("invoices").select("*").limit(1)
      .then(({ data, error }) => {
        setData(data);
        setError(error);
      });
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Supabase Client Test</h1>

      <h2 className="mt-4 font-semibold">Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <h2 className="mt-4 font-semibold">Error:</h2>
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    try {
      await fetch("/api/test/org/bootstrap", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Organization" }),
      });
    } catch (e) {
      console.error("org bootstrap failed", e);
    }

    // Depending on your Supabase email confirmation settings:
    // - If confirmation is OFF: user is logged in immediately
    // - If ON: user must confirm email first
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Sign up</h1>

        {err && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              className="border rounded-md px-3 py-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-black text-white text-sm font-medium disabled:opacity-60"
            type="submit"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}


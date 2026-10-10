"use client";

import { useState } from "react";
import Image from "next/image";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { Button, Field, inputClass } from "@/components/ui";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);

    const { data, error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err || !data.user) {
      setError(err?.message ?? "Couldn't sign in.");
      setBusy(false);
      return;
    }
    if (data.user.app_metadata?.role !== "admin") {
      await sb.auth.signOut();
      setError("This account isn't an admin. Ask an existing admin to grant access.");
      setBusy(false);
      return;
    }

    // Only follow ?next= to paths inside /admin.
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
  }

  return (
    <form onSubmit={onSubmit} className="glass-panel w-full max-w-md p-8 sm:p-10">
      <div className="relative w-40 h-16 mx-auto mb-6">
        <Image src="/vpl-logo-transparent.png" alt="VPL" fill sizes="160px" className="object-contain" priority />
      </div>
      <h1 className="text-3xl font-display font-bold tracking-tight text-center mb-1">Admin sign in</h1>
      <p className="text-sm text-white/50 text-center mb-8 normal-case font-sans">Vista Premier League control room</p>

      {!supabaseConfigured && (
        <p role="alert" className="mb-6 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b] normal-case font-sans">
          Supabase isn&apos;t configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart.
        </p>
      )}

      <div className="space-y-5">
        <Field label="Email">
          {(id) => (
            <input
              id={id}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Password">
          {(id) => (
            <input
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-400 normal-case font-sans">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full mt-8" disabled={busy || !supabaseConfigured}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

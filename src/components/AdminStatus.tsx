"use client";

import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

/** Sign-out button for the admin nav. */
export function SignOutButton() {
  async function signOut() {
    await getSupabase()?.auth.signOut();
    window.location.assign("/admin/login");
  }
  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      Sign out
    </Button>
  );
}

/** Shows load/save problems (not configured, rejected write, lost connection) under the nav. */
export function SyncBanner() {
  const { error } = useStore();
  if (!error) return null;
  return (
    <div role="alert" className="border-b border-red-500/30 bg-red-500/10">
      <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-red-200 normal-case font-sans">{error}</p>
    </div>
  );
}

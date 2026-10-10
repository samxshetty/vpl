"use client";

import { Activity } from "lucide-react";
import { useLiveDB } from "@/lib/store";
import { sortMatches } from "@/lib/format";
import { entryMap } from "@/lib/derive";
import { LiveError, MatchCard, PageSkeleton } from "@/components/PublicBits";

/** Shows every match currently marked LIVE in Supabase. */
export function LiveMatchesSection() {
  const { ready, db } = useLiveDB();

  if (!ready) {
    return (
      <section className="mb-16" aria-label="Live matches" aria-busy="true">
        <div className="mb-5 flex items-center gap-3">
          <Activity className="h-5 w-5 text-[#f59e0b]" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">LIVE MATCHES</h2>
        </div>
        <PageSkeleton />
      </section>
    );
  }

  const liveMatches = sortMatches(db.matches.filter((match) => match.status === "LIVE" && !match.bye));
  const map = entryMap(db);

  return (
    <section className="mb-16" aria-labelledby="live-matches-heading">
      <LiveError />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#f59e0b]">
            <Activity className="h-5 w-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.25em]">Live now</span>
          </div>
          <h2 id="live-matches-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-white">LIVE MATCHES</h2>
        </div>
        {liveMatches.length > 0 && (
          <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-xs font-semibold text-[#fbbf24]">
            {liveMatches.length} {liveMatches.length === 1 ? "match" : "matches"} live
          </span>
        )}
      </div>

      {liveMatches.length === 0 ? (
        <div className="glass-panel rounded-2xl px-6 py-8 text-center">
          <p className="text-base font-semibold text-white/80">No matches are live right now.</p>
          <p className="mt-2 text-sm text-white/45">Live matches will appear here when the admin marks a fixture as LIVE.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {liveMatches.map((match) => <MatchCard key={match.id} m={match} map={map} />)}
        </div>
      )}
    </section>
  );
}

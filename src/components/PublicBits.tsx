"use client";

import Link from "next/link";
import clsx from "clsx";
import type { Match } from "@/lib/types";
import { getSport } from "@/lib/sports";
import { fmtDateTime } from "@/lib/format";
import { sideTitle, type EntryMap } from "@/lib/derive";
import { StatusBadge } from "@/components/ui";
import { useLiveDB } from "@/lib/store";

/** One match as a compact row that links to its match page. */
export function MatchCard({ m, map }: { m: Match; map: EntryMap }) {
  const sport = getSport(m.sportId);
  const aWon = m.status === "COMPLETED" && m.result === "A";
  const bWon = m.status === "COMPLETED" && m.result === "B";
  const started = m.status !== "UPCOMING";

  return (
    <Link
      href={`/matches/${m.id}`}
      className="glass-panel block px-6 py-5 transition-all hover:border-white/20 hover:-translate-y-0.5 outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b]"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f59e0b] font-sans">
          <span aria-hidden className="mr-2">{sport?.icon}</span>
          {sport?.name ?? m.sportId} <span className="text-white/20 mx-1">/</span> {m.stage}
        </span>
        <StatusBadge status={m.status} />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className={clsx("text-2xl md:text-3xl font-display font-bold tracking-tight truncate", bWon ? "text-white/40" : "text-white")}>
          {sideTitle(map, m.aId)}
        </div>
        <div className="text-center min-w-20">
          {started ? (
            <div
              className={clsx(
                "font-numbers text-2xl md:text-3xl tracking-wider whitespace-nowrap",
                m.status === "COMPLETED"
                  ? "text-[#facc15]"
                  : "text-[#f59e0b]"
              )}
            >
              {m.scoreA || "–"} <span className="text-white/25">-</span> {m.scoreB || "–"}
            </div>
          ) : (
            <div className="text-xs text-white/30 font-mono px-2 py-0.5 rounded border border-white/5 bg-black/40">VS</div>
          )}
        </div>
        <div className={clsx("text-2xl md:text-3xl font-display font-bold tracking-tight truncate text-right", aWon ? "text-white/40" : "text-white")}>
          {sideTitle(map, m.bId)}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 mt-4 pt-4 border-t border-white/[0.05] text-xs text-white/45 font-sans normal-case">
        <span>{fmtDateTime(m.startsAt)}</span>
        <span>{m.venue}</span>
      </div>
    </Link>
  );
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-16 w-2/3 rounded-2xl bg-white/[0.03] animate-pulse mb-10" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel h-56 animate-pulse" />
        <div className="glass-panel h-56 animate-pulse" />
      </div>
    </div>
  );
}

/** Shown only when live data can't be loaded. */
export function LiveError() {
  const { error } = useLiveDB();
  if (!error) return null;
  return (
    <p role="alert" className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200 font-sans normal-case">
      {error}
    </p>
  );
}
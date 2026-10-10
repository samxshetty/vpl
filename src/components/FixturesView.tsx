"use client";

import { useState } from "react";
import clsx from "clsx";
import { useLiveDB } from "@/lib/store";
import { SPORTS } from "@/lib/sports";
import { dayKey, fmtDay, sortMatches } from "@/lib/format";
import { entryMap } from "@/lib/derive";
import type { Match, MatchStatus } from "@/lib/types";
import { LiveError, MatchCard, PageSkeleton } from "@/components/PublicBits";

type StatusFilter = "ALL" | MatchStatus;
const STATUS_TABS: Array<{ id: StatusFilter; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "LIVE", label: "Live" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "COMPLETED", label: "Results" },
];

const chip = (active: boolean) =>
  clsx(
    "px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest font-sans transition-colors outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b]",
    active ? "bg-white text-black border-white" : "border-white/15 text-white/55 hover:text-white hover:border-white/30"
  );

/** Group a sorted list of matches by day. */
export function groupByDay(matches: Match[]): Array<{ key: string; label: string; matches: Match[] }> {
  const groups: Array<{ key: string; label: string; matches: Match[] }> = [];
  for (const m of matches) {
    const key = dayKey(m.startsAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.matches.push(m);
    else groups.push({ key, label: fmtDay(m.startsAt), matches: [m] });
  }
  return groups;
}

export function FixturesView() {
  const { ready, db } = useLiveDB();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sportId, setSportId] = useState<string>("ALL");
  if (!ready) return <PageSkeleton />;

  const map = entryMap(db);
  let list = db.matches.filter((m) => !m.bye && m.aId && m.bId);
  if (status !== "ALL") list = list.filter((m) => m.status === status);
  if (sportId !== "ALL") list = list.filter((m) => m.sportId === sportId);
  list = sortMatches(list);
  if (status === "COMPLETED") list = list.reverse();
  const groups = groupByDay(list);

  return (
    <>
      <LiveError />
      <div className="space-y-4 mb-10">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_TABS.map((t) => (
            <button key={t.id} onClick={() => setStatus(t.id)} aria-pressed={status === t.id} className={chip(status === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sport">
          <button onClick={() => setSportId("ALL")} aria-pressed={sportId === "ALL"} className={chip(sportId === "ALL")}>
            All sports
          </button>
          {SPORTS.map((s) => (
            <button key={s.id} onClick={() => setSportId(s.id)} aria-pressed={sportId === s.id} className={chip(sportId === s.id)}>
              <span aria-hidden className="mr-1.5">{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel px-8 py-14 text-center">
          <h3 className="text-2xl font-display font-bold text-white/90">Nothing here yet</h3>
          <p className="text-sm text-white/50 mt-2 font-sans normal-case">No matches fit these filters.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">{g.label}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {g.matches.map((m) => (
                  <MatchCard key={m.id} m={m} map={map} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

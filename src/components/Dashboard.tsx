"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { SPORTS } from "@/lib/sports";
import { FORMAT_LABEL } from "@/lib/types";
import { fmtDateTime, sortMatches } from "@/lib/format";
import { Button, ConfirmDialog } from "./ui";

export function Dashboard() {
  const { ready } = useStore();
  return ready ? <Loaded /> : <Skeleton />;
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading sports">
      <div className="h-24 w-2/3 rounded-2xl bg-white/[0.03] animate-pulse mb-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel h-64 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function Loaded() {
  const { db, loadSampleData } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const isEmpty = db.entries.length === 0 && db.matches.length === 0;
  const live = db.matches.filter((m) => m.status === "LIVE").length;
  const upcoming = db.matches.filter((m) => m.status === "UPCOMING" && !m.bye).length;
  // Section placeholders are pre-created so fixtures can be prepared; count only entries with a completed roster as registered.
  const registeredTeams = db.entries.filter((e) => e.kind === "team" && e.players.length > 0 && e.players.every((p) => p.name.trim() && p.usn.trim())).length;
  const players = db.entries.filter((e) => e.kind === "solo" && e.name.trim() && e.usn.trim()).length;

  const stats = [
    { label: "Live now", value: live, accent: live > 0 },
    { label: "Upcoming matches", value: upcoming },
    { label: "Teams registered", value: registeredTeams },
    { label: "Players registered", value: players },
  ];

  return (
    <>
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-white drop-shadow-lg">
          All sports
        </h1>
        <p className="text-white/55 max-w-2xl mt-4 text-lg">
          Each event category has its own entries, fixtures and results. Section slots are pre-created; only completed rosters count as registered.
        </p>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel px-6 py-5">
            <dd
              className={clsx(
                "font-numbers text-5xl tracking-wider",
                s.accent ? "text-[#f59e0b] drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "text-white"
              )}
            >
              {s.value}
            </dd>
            <dt className="text-xs font-semibold text-white/50 mt-1">{s.label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10">
        {SPORTS.map((sport) => {
          const entries = db.entries.filter((e) => e.sportId === sport.id);
          const matches = db.matches.filter((m) => m.sportId === sport.id && !m.bye);
          const liveCount = matches.filter((m) => m.status === "LIVE").length;
          const done = matches.filter((m) => m.status === "COMPLETED").length;
          const fmt = db.formats[sport.id]?.format;
          const next = sortMatches(matches.filter((m) => m.status !== "COMPLETED" && m.startsAt))[0];
          const noun = sport.kind === "TEAM" ? "teams" : "players";

          return (
            <Link key={sport.id} href={`/admin/sports/${sport.id}`} className="group relative block outline-none">
              <div
                className={`absolute -inset-0.5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${sport.theme} to-transparent mix-blend-screen`}
              />
              <div
                className={`glass-panel p-8 relative overflow-hidden bg-gradient-to-br ${sport.theme} to-transparent h-full transition-colors duration-300 group-hover:border-white/20 group-focus-visible:border-[#f59e0b]/60 flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="text-7xl opacity-80 group-hover:opacity-100 drop-shadow-2xl" aria-hidden>
                    {sport.icon}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
                    {sport.kind === "TEAM" ? "Team" : "Individual"}
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-tighter mb-4 text-white/90 group-hover:text-white transition-colors">
                    {sport.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-white/50">
                    <span>
                      {entries.filter((e) => e.kind === "team" ? e.players.length > 0 && e.players.every((p) => p.name.trim() && p.usn.trim()) : Boolean(e.name.trim() && e.usn.trim())).length} registered {sport.kind === "TEAM" ? "teams" : "players"}
                    </span>
                    <span className="text-white/20">|</span>
                    <span>
                      {done}/{matches.length} matches played
                    </span>
                    {liveCount > 0 && (
                      <>
                        <span className="text-white/20">|</span>
                        <span className="flex items-center gap-2 text-[#f59e0b]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                          {liveCount} live
                        </span>
                      </>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs text-white/40 font-semibold">
                        {fmt ? FORMAT_LABEL[fmt] : "Format not set"}
                      </div>
                      <div className="text-sm text-white/75 truncate">
                        {next ? `Next: ${fmtDateTime(next.startsAt)}` : "No matches scheduled"}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(isEmpty || process.env.NEXT_PUBLIC_ENABLE_DEMO_RESET === "true") && (
        <div className="mt-16 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => (isEmpty ? loadSampleData() : setConfirmReset(true))}>
            {isEmpty ? "Load sample data" : "Reset to sample data"}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmReset}
        title="Replace ALL live data with sample data?"
        message="This deletes every team, player and match in the live database, for everyone, and loads the original sample data. It cannot be undone."
        confirmLabel="Reset data"
        onConfirm={loadSampleData}
        onClose={() => setConfirmReset(false)}
      />
    </>
  );
}

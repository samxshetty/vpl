"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { getSport } from "@/lib/sports";
import { FORMAT_LABEL } from "@/lib/types";
import { MatchesTab } from "./MatchesTab";
import { EntriesTab } from "./EntriesTab";
import { ScheduleTab } from "./ScheduleTab";

type TabId = "matches" | "entries" | "schedule";

export function SportView({ sportId }: { sportId: string }) {
  const { ready } = useStore();
  return ready ? <Loaded sportId={sportId} /> : <Skeleton />;
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading sport">
      <div className="h-6 w-28 rounded bg-white/[0.03] animate-pulse mb-8" />
      <div className="h-28 w-1/2 rounded-2xl bg-white/[0.03] animate-pulse mb-10" />
      <div className="glass-panel h-80 animate-pulse" />
    </div>
  );
}

function Loaded({ sportId }: { sportId: string }) {
  const sport = getSport(sportId)!;
  const { db } = useStore();
  const [tab, setTab] = useState<TabId>("matches");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ matches: null, entries: null, schedule: null });

  const entries = db.entries.filter((e) => e.sportId === sportId);
  const matches = db.matches.filter((m) => m.sportId === sportId && !m.bye);
  const live = matches.filter((m) => m.status === "LIVE").length;
  const fmt = db.formats[sportId]?.format;
  const noun = sport.kind === "TEAM" ? "Teams" : "Players";

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "matches", label: "Matches", count: matches.length },
    { id: "entries", label: noun, count: entries.length },
    { id: "schedule", label: "Format & schedule" },
  ];

  // Arrow keys move between tabs, as people expect from a tab list.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    setTab(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
  };

  return (
    <>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors mb-8 outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b] rounded"
      >
        <ArrowLeft className="w-4 h-4" /> All sports
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="text-7xl drop-shadow-2xl" aria-hidden>
            {sport.icon}
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tighter text-white">{sport.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-white/50">
              <span>{sport.kind === "TEAM" ? "Team sport" : "Individual sport"}</span>
              <span className="text-white/20">|</span>
              <span>{fmt ? FORMAT_LABEL[fmt] : "Format not set"}</span>
              {live > 0 && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-2 text-[#f59e0b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                    {live} live
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label={`${sport.name} management`} onKeyDown={onKeyDown} className="flex gap-8 border-b border-white/10 mb-10 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={clsx(
              "pb-4 -mb-px text-sm font-semibold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors outline-none focus-visible:text-white",
              tab === t.id ? "text-white border-white" : "text-white/50 border-transparent hover:text-white/80"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-2 font-numbers text-lg tracking-wider text-white/40">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "matches" && <MatchesTab
          sport={sport}
          onSetUp={() => setTab("schedule")}
          onManageEntries={() => setTab("entries")}
        />}
        {tab === "entries" && <EntriesTab sport={sport} />}
        {tab === "schedule" && <ScheduleTab sport={sport} onGenerated={() => setTab("matches")} />}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import type { Entry, Match, MatchStatus, Sport } from "@/lib/types";
import { dayKey, entryParts, fmtDay, fmtTime, sortMatches, uid } from "@/lib/format";
import { Bracket } from "./Bracket";
import { Standings } from "./Standings";
import { MatchEditor } from "./MatchEditor";
import { Button, EmptyState, StatusBadge } from "./ui";

type View = "list" | "bracket" | "standings";
type Filter = "ALL" | MatchStatus;

export function MatchesTab({
  sport,
  onSetUp,
  onManageEntries,
}: {
  sport: Sport;
  onSetUp: () => void;
  onManageEntries: () => void;
}) {
  const { db } = useStore();
  const entries = db.entries.filter((e) => e.sportId === sport.id);
  const all = db.matches.filter((m) => m.sportId === sport.id);
  const visible = all.filter((m) => !m.bye);
  const hasKnockout = all.some((m) => m.format === "KNOCKOUT");
  const hasRoundRobin = all.some((m) => m.format === "ROUND_ROBIN");

  const [view, setView] = useState<View>(() => (db.formats[sport.id]?.format === "KNOCKOUT" ? "bracket" : "list"));
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editing, setEditing] = useState<{ match: Match; isNew: boolean } | null>(null);

  const noun = sport.kind === "TEAM" ? "teams" : "players";

  const addMatch = () =>
    setEditing({
      isNew: true,
      match: {
        id: uid("m"),
        sportId: sport.id,
        format: "SINGLE",
        stage: "Match",
        round: 1,
        slot: all.length,
        aId: null,
        bId: null,
        startsAt: null,
        venue: sport.defaultVenue,
        status: "UPCOMING",
        scoreA: "",
        scoreB: "",
        result: null,
        note: "",
      },
    });

  if (entries.length < 2) {
    return (
      <EmptyState
        title={`Add ${noun} first`}
        body={`A match needs two ${noun}. Add at least two, then come back to set up matches.`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={onManageEntries}>
              <Plus className="w-4 h-4" /> {sport.kind === "TEAM" ? "Add team" : "Add player"}
            </Button>
            <Button onClick={onSetUp}>Format &amp; schedule</Button>
          </div>
        }
      />
    );
  }

  if (visible.length === 0) {
    return (
      <>
        <EmptyState
          title="No matches yet"
          body="Generate a full schedule from a format, or add a single match by hand."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={onSetUp}>
                Set up matches
              </Button>
              <Button onClick={addMatch}>
                <Plus className="w-4 h-4" /> Add one match
              </Button>
            </div>
          }
        />
        {editing && <MatchEditor sport={sport} match={editing.match} isNew={editing.isNew} onClose={() => setEditing(null)} />}
      </>
    );
  }

  const counts: Record<Filter, number> = {
    ALL: visible.length,
    LIVE: visible.filter((m) => m.status === "LIVE").length,
    UPCOMING: visible.filter((m) => m.status === "UPCOMING").length,
    COMPLETED: visible.filter((m) => m.status === "COMPLETED").length,
  };
  const filters: Array<{ id: Filter; label: string }> = [
    { id: "ALL", label: "All" },
    { id: "LIVE", label: "Live" },
    { id: "UPCOMING", label: "Upcoming" },
    { id: "COMPLETED", label: "Completed" },
  ];

  const views: Array<{ id: View; label: string }> = [{ id: "list", label: "List" }];
  if (hasKnockout) views.push({ id: "bracket", label: "Bracket" });
  if (hasRoundRobin) views.push({ id: "standings", label: "Standings" });
  const activeView = views.some((v) => v.id === view) ? view : "list";

  const shown = sortMatches(visible.filter((m) => filter === "ALL" || m.status === filter));
  const groups: Array<{ key: string; label: string; items: Match[] }> = [];
  for (const m of shown) {
    const k = dayKey(m.startsAt);
    const g = groups.find((x) => x.key === k);
    if (g) g.items.push(m);
    else groups.push({ key: k, label: fmtDay(m.startsAt), items: [m] });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {views.length > 1 && (
            <div className="flex rounded-xl border border-white/10 bg-black/30 p-1" role="group" aria-label="View">
              {views.map((v) => (
                <button
                  key={v.id}
                  aria-pressed={activeView === v.id}
                  onClick={() => setView(v.id)}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#f59e0b]",
                    activeView === v.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
          {activeView === "list" && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {filters.map((f) => (
                <button
                  key={f.id}
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={clsx(
                    "px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#f59e0b]",
                    filter === f.id
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-white/50 hover:text-white hover:border-white/25"
                  )}
                >
                  {f.label} <span className="font-numbers text-sm tracking-wider ml-1 text-white/40">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="primary" onClick={addMatch}>
          <Plus className="w-4 h-4" /> Add match
        </Button>
      </div>

      {activeView === "bracket" && (
        <Bracket
          matches={all.filter((m) => m.format === "KNOCKOUT")}
          entries={entries}
          onOpen={(m) => setEditing({ match: m, isNew: false })}
        />
      )}
      {activeView === "standings" && <Standings matches={all} entries={entries} />}

      {activeView === "list" &&
        (groups.length === 0 ? (
          <EmptyState title="Nothing here" body="No matches have this status. Try another filter." />
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label}>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 flex items-center gap-3 mb-4 font-sans">
                  <span className="w-1.5 h-1.5 bg-white/20 rounded-full" /> {g.label}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {g.items.map((m) => (
                    <MatchRow key={m.id} m={m} entries={entries} onEdit={() => setEditing({ match: m, isNew: false })} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ))}

      {editing && <MatchEditor sport={sport} match={editing.match} isNew={editing.isNew} onClose={() => setEditing(null)} />}
    </>
  );
}

function MatchRow({ m, entries, onEdit }: { m: Match; entries: Entry[]; onEdit: () => void }) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const a = entryParts(m.aId ? byId.get(m.aId) : null);
  const b = entryParts(m.bId ? byId.get(m.bId) : null);
  const started = m.status !== "UPCOMING";
  const winA = m.status === "COMPLETED" && m.result === "A";
  const winB = m.status === "COMPLETED" && m.result === "B";

  return (
    <div
      className={clsx(
        "glass-panel p-0 overflow-hidden transition-colors hover:border-white/20",
        m.status === "LIVE" && "!border-[#f59e0b]/40"
      )}
    >
      <div className="px-6 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="text-xs text-white/50 font-semibold">
          {m.stage}
          <span className="text-white/20 mx-2">/</span>
          <span className="text-white/80">{m.startsAt ? fmtTime(m.startsAt) : "Time not set"}</span>
          {m.venue && (
            <>
              <span className="text-white/20 mx-2">/</span>
              {m.venue}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={m.status} />
          <Button size="sm" onClick={onEdit} aria-label={`Edit ${a.title} versus ${b.title}`}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Side title={a.title} sub={a.sub} win={winA} dim={m.status === "COMPLETED" && !winA} align="left" />
        <div className="text-center min-w-24">
          {started ? (
            <div className="font-numbers text-4xl tracking-wider text-[#f59e0b] drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {m.scoreA || "–"} <span className="text-white/25">:</span> {m.scoreB || "–"}
            </div>
          ) : (
            <div className="text-xs text-white/30 font-mono px-2 py-0.5 rounded border border-white/5 bg-black/40 inline-block">VS</div>
          )}
          {m.note && <div className="text-xs text-white/45 mt-1.5 normal-case">{m.note}</div>}
        </div>
        <Side title={b.title} sub={b.sub} win={winB} dim={m.status === "COMPLETED" && !winB} align="right" />
      </div>
    </div>
  );
}

function Side({ title, sub, win, dim, align }: { title: string; sub: string; win: boolean; dim: boolean; align: "left" | "right" }) {
  return (
    <div className={clsx("min-w-0", align === "right" ? "text-right" : "text-left")}>
      <div
        className={clsx(
          "text-3xl sm:text-4xl font-display font-bold tracking-tighter truncate",
          win ? "text-white" : dim ? "text-white/40" : title === "TBD" ? "text-white/25" : "text-white/85"
        )}
      >
        {title}
      </div>
      {sub && <div className="text-xs text-white/40 mt-1 truncate">{sub}</div>}
    </div>
  );
}

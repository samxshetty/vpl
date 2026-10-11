"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SPORTS } from "@/lib/sports";
import type { SportAward } from "@/lib/types";
import { LiveError, PageSkeleton } from "@/components/PublicBits";

const blank = (sportId: string): SportAward => ({
  sportId,
  winnerEntryId: null,
  runnerUpEntryId: null,
  semifinalistAEntryId: null,
  semifinalistBEntryId: null,
  updatedAt: new Date().toISOString(),
});

const fields = [
  { key: "winnerEntryId", label: "Winner", pointsTeam: 15, pointsIndividual: 7 },
  { key: "runnerUpEntryId", label: "Runner-up", pointsTeam: 10, pointsIndividual: 4 },
  { key: "semifinalistAEntryId", label: "Semi-finalist 1", pointsTeam: 5, pointsIndividual: 2 },
  { key: "semifinalistBEntryId", label: "Semi-finalist 2", pointsTeam: 5, pointsIndividual: 2 },
] as const;

type AwardKey = typeof fields[number]["key"];

function entryLabel(entry: { kind: string; name: string; section?: string; className?: string }) {
  const group = entry.kind === "team" ? entry.section : entry.className;
  return `${entry.name}${group ? ` — ${group}` : ""}`;
}

export function PlacementsEditor() {
  const { ready, db, saveSportAward, clearSportAward } = useStore();
  const [drafts, setDrafts] = useState<Record<string, SportAward>>({});
  const [notice, setNotice] = useState("");

  const entryMap = useMemo(() => new Map(db.entries.map((entry) => [entry.id, entry])), [db.entries]);
  if (!ready) return <PageSkeleton />;

  function getDraft(sportId: string) {
    return drafts[sportId] ?? db.awards[sportId] ?? blank(sportId);
  }

  function updateDraft(sportId: string, key: AwardKey, value: string) {
    setDrafts((old) => ({
      ...old,
      [sportId]: { ...getDraft(sportId), [key]: value || null, updatedAt: new Date().toISOString() },
    }));
    setNotice("");
  }

  function save(sportId: string) {
    const award = getDraft(sportId);
    const ids = [award.winnerEntryId, award.runnerUpEntryId, award.semifinalistAEntryId, award.semifinalistBEntryId].filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      setNotice("Each placement must be a different entry.");
      return;
    }
    const wrongSport = ids.some((id) => entryMap.get(id!)?.sportId !== sportId);
    if (wrongSport) {
      setNotice("Choose entries registered in this sport only.");
      return;
    }
    saveSportAward(award);
    setNotice(`Saved ${SPORTS.find((sport) => sport.id === sportId)?.name ?? "sport"} placements.`);
  }

  function clear(sportId: string) {
    clearSportAward(sportId);
    setDrafts((old) => { const next = { ...old }; delete next[sportId]; return next; });
    setNotice(`Cleared ${SPORTS.find((sport) => sport.id === sportId)?.name ?? "sport"} placements.`);
  }

  return (
    <div>
      <LiveError />
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-white">Championship placements</h1>
        <p className="mt-3 max-w-3xl text-sm md:text-base text-white/55 normal-case font-sans">
          Enter the final positions for each event. These are the only source of VPL championship points; match wins and draws do not award points.
        </p>
        <div className="mt-4 inline-flex flex-wrap gap-3 text-xs font-semibold">
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/70">Team: 15 / 10 / 5 / 5</span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/70">Individual: 7 / 4 / 2 / 2</span>
        </div>
      </div>

      {notice && <p role="status" className="mb-5 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fcd34d]">{notice}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {SPORTS.map((sport) => {
          const entries = db.entries.filter((entry) => entry.sportId === sport.id);
          const draft = getDraft(sport.id);
          const complete = Boolean(draft.winnerEntryId && draft.runnerUpEntryId && draft.semifinalistAEntryId && draft.semifinalistBEntryId);
          return (
            <section key={sport.id} className="glass-panel rounded-2xl border border-white/10 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-white">{sport.icon} {sport.name}</h2>
                  <p className="mt-1 text-xs text-white/45">{sport.kind === "TEAM" ? "Team event · 15 / 10 / 5 / 5 points" : "Individual event · 7 / 4 / 2 / 2 points"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${db.awards[sport.id] ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                  {db.awards[sport.id] ? "Saved" : "Not set"}
                </span>
              </div>

              <div className="space-y-4">
                {fields.map((field) => {
                  const value = draft[field.key] ?? "";
                  const points = sport.kind === "TEAM" ? field.pointsTeam : field.pointsIndividual;
                  return (
                    <label key={field.key} className="block">
                      <span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-white/65">
                        <span>{field.label}</span>
                        <span className="text-[#f59e0b]">{points} pts</span>
                      </span>
                      <select
                        value={value}
                        onChange={(event) => updateDraft(sport.id, field.key, event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#111114] px-3 py-3 text-sm text-white outline-none focus:border-[#f59e0b]/60"
                      >
                        <option value="">Not assigned</option>
                        {entries.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entryLabel(entry)}</option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-xs text-white/40">{complete ? "All four placements selected" : "Placements can be saved as they become known"}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => clear(sport.id)} disabled={!db.awards[sport.id] && !drafts[sport.id]} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/55 transition hover:bg-white/5 disabled:opacity-30">Clear</button>
                  <button type="button" onClick={() => save(sport.id)} className="rounded-lg bg-[#f59e0b] px-4 py-2 text-xs font-extrabold text-black transition hover:bg-[#fbbf24]">Save placements</button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

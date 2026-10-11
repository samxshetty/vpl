"use client";

import clsx from "clsx";
import type { Entry, Match } from "@/lib/types";
import { entryParts, fmtDateTime } from "@/lib/format";

/**
 * Knockout tree. Built recursively from the final backwards so each match sits
 * exactly between the two matches that feed it.
 */
export function Bracket({
  matches,
  entries,
  onOpen,
}: {
  matches: Match[];
  entries: Entry[];
  onOpen: (m: Match) => void;
}) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const feeders = new Map<string, Match[]>();
  for (const m of matches) {
    if (m.nextMatchId) feeders.set(m.nextMatchId, [...(feeders.get(m.nextMatchId) ?? []), m]);
  }
  for (const list of feeders.values()) list.sort((a, b) => a.slot - b.slot);

  const finals = matches.filter((m) => !m.nextMatchId && m.format === "KNOCKOUT");
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  const stageByRound = new Map(matches.map((m) => [m.round, m.stage]));

  if (finals.length === 0) return null;

  return (
    <div className="glass-panel p-6 sm:p-8 overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-5" aria-hidden>
          {Array.from({ length: maxRound }, (_, i) => i + 1).map((r) => (
            <div key={r} className="flex">
              <div className="w-64 text-xs font-semibold text-white/50">{stageByRound.get(r)}</div>
              {r < maxRound && <div className="w-10 shrink-0" />}
            </div>
          ))}
        </div>
        {finals.map((f) => (
          <Node key={f.id} m={f} feeders={feeders} byId={byId} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

interface NodeProps {
  m: Match;
  feeders: Map<string, Match[]>;
  byId: Map<string, Entry>;
  onOpen: (m: Match) => void;
}

function Node({ m, feeders, byId, onOpen }: NodeProps) {
  const kids = feeders.get(m.id) ?? [];
  return (
    <div className="flex items-stretch">
      {kids.length > 0 && (
        <>
          <div className="flex flex-col justify-around">
            {kids.map((k) => (
              <Node key={k.id} m={k} feeders={feeders} byId={byId} onOpen={onOpen} />
            ))}
          </div>
          <div className="relative w-10 shrink-0" aria-hidden>
            <span className="absolute left-0 w-1/2 h-px top-1/4 bg-white/15" />
            <span className="absolute left-0 w-1/2 h-px top-3/4 bg-white/15" />
            <span className="absolute left-1/2 top-1/4 bottom-1/4 w-px bg-white/15" />
            <span className="absolute left-1/2 right-0 h-px top-1/2 bg-white/15" />
          </div>
        </>
      )}
      <div className="flex items-center py-2">
        <Card m={m} byId={byId} onOpen={onOpen} />
      </div>
    </div>
  );
}

function Card({
  m,
  byId,
  onOpen,
}: {
  m: Match;
  byId: Map<string, Entry>;
  onOpen: (m: Match) => void;
}) {
  const a = entryParts(m.aId ? byId.get(m.aId) : null);
  const b = entryParts(m.bId ? byId.get(m.bId) : null);
  const done = m.status === "COMPLETED";
  const row = (side: "A" | "B", p: { title: string; sub: string }, score: string, tbd: boolean) => {
    const won = done && m.result === side;
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="min-w-0 flex-1">
          <span
            className={clsx(
              "block truncate font-display text-lg font-bold tracking-tight",
              tbd ? "text-white/25" : won ? "text-white" : done ? "text-white/45" : "text-white/85"
            )}
          >
            {p.title}
          </span>
          {p.sub && <span className="block truncate text-xs font-semibold text-white/40 mt-0.5">{p.sub}</span>}
        </span>
        <span className={clsx("font-numbers text-xl tracking-wider", won ? "text-[#f59e0b]" : "text-white/40")}>
          {score}
        </span>
      </div>
    );
  };

  const inner = (
    <>
      {row("A", a, m.scoreA, !m.aId)}
      <div className="h-px bg-white/[0.07]" />
      {m.bye ? (
        <div className="px-4 py-2.5 text-sm text-white/30">Bye</div>
      ) : (
        row("B", b, m.scoreB, !m.bId)
      )}
      <div className="px-4 py-1.5 border-t border-white/[0.07] bg-black/30 rounded-b-2xl flex items-center justify-between gap-2 text-[11px] text-white/40">
        <span className="truncate">{m.bye ? "Advances automatically" : fmtDateTime(m.startsAt)}</span>
        {m.status === "LIVE" && (
          <span className="flex items-center gap-1.5 text-[#f59e0b] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" /> Live
          </span>
        )}
      </div>
    </>
  );

  const base = "w-64 rounded-2xl border bg-white/[0.03] text-left";
  return (
    <button
      onClick={() => onOpen(m)}
      aria-label={`Edit ${a.title} versus ${b.title}, ${m.stage}`}
      className={clsx(
        base,
        "transition-colors hover:border-white/25 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-[#f59e0b]",
        m.bye
          ? "border-dashed border-[#f59e0b]/35 opacity-80 hover:opacity-100"
          : m.status === "LIVE" ? "border-[#f59e0b]/50" : "border-white/10"
      )}
    >
      {inner}
    </button>
  );
}

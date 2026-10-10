"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLiveDB } from "@/lib/store";
import { getSport } from "@/lib/sports";
import { FORMAT_LABEL, type Entry } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { entryMap, sideSub, sideTitle } from "@/lib/derive";
import { StatusBadge } from "@/components/ui";
import { LiveError, PageSkeleton } from "@/components/PublicBits";

function Roster({ title, entry }: { title: string; entry: Entry | undefined }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      {!entry ? (
        <p className="text-sm text-gray-500 font-sans normal-case">To be decided.</p>
      ) : entry.kind === "team" ? (
        entry.players.length === 0 ? (
          <p className="text-sm text-gray-500 font-sans normal-case">No roster added yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 text-sm">
            {entry.players.map((p) => (
              <li key={p.id} className="py-2.5 flex justify-between gap-4">
                <span className="font-semibold text-gray-200">{p.name}</span>
                <span className="text-gray-500 font-mono text-xs">{p.usn}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-sm text-gray-400 font-sans normal-case">
          {entry.name} · {entry.className} · <span className="font-mono">{entry.usn}</span>
        </p>
      )}
    </div>
  );
}

export function MatchCenter() {
  const { matchId } = useParams<{ matchId: string }>();
  const { ready, db } = useLiveDB();
  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-12">
        <PageSkeleton />
      </div>
    );
  }

  const match = db.matches.find((m) => m.id === matchId);
  if (!match) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-16 text-center">
        <LiveError />
        <h1 className="text-4xl font-bold tracking-tighter mb-4">MATCH NOT FOUND</h1>
        <p className="text-gray-400 mb-8 font-sans normal-case">This match doesn&apos;t exist, or it was removed from the schedule.</p>
        <Link href="/fixtures" className="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white">
          See all fixtures
        </Link>
      </div>
    );
  }

  const map = entryMap(db);
  const sport = getSport(match.sportId);
  const a = match.aId ? map.get(match.aId) : undefined;
  const b = match.bId ? map.get(match.bId) : undefined;
  const live = match.status === "LIVE";
  const started = match.status !== "UPCOMING";

  const info: Array<[string, string]> = [
    ["Stage", match.stage],
    ["Kick-off", fmtDateTime(match.startsAt)],
    ["Venue", match.venue || "To be confirmed"],
    ["Format", FORMAT_LABEL[match.format]],
  ];

  return (
    <>
      <div className="relative border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center relative z-10">
          <LiveError />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
            {live && <span className="text-[#f59e0b] animate-pulse">●</span>}
            <span aria-hidden>{sport?.icon}</span> {sport?.name ?? match.sportId} // {match.venue}
          </div>

          <div className="flex justify-center items-center gap-6 md:gap-16 mb-8">
            <div className="text-5xl md:text-7xl font-bold tracking-tighter break-words max-w-[40%]">{sideTitle(map, match.aId)}</div>
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">{match.stage}</div>
              <div className="text-2xl text-gray-600 font-mono">VS</div>
            </div>
            <div className="text-5xl md:text-7xl font-bold tracking-tighter text-gray-500 break-words max-w-[40%]">{sideTitle(map, match.bId)}</div>
          </div>

          <div className="inline-block glass-panel px-8 py-4 rounded-2xl border border-[#f59e0b]/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
            {started ? (
              <div className="text-4xl md:text-6xl font-bold text-[#f59e0b] font-mono tracking-tighter">
                {match.scoreA || "–"} <span className="text-white/25">-</span> {match.scoreB || "–"}
              </div>
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-white/70 font-mono tracking-tight">{fmtDateTime(match.startsAt)}</div>
            )}
            <div className="mt-3 flex justify-center">
              <StatusBadge status={match.status} />
            </div>
            {match.note && <div className="text-sm text-gray-400 mt-3 font-sans normal-case">{match.note}</div>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="p-4 border-b border-white/10 bg-white/5 text-sm font-bold">Match info</div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
            {info.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{k}</dt>
                <dd className="text-sm font-semibold text-gray-200 font-sans normal-case">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
          <div className="p-4 border-b border-white/10 bg-white/5 text-sm font-bold">{sport?.kind === "TEAM" ? "Squads" : "Players"}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-6">
            <Roster title={`${sideTitle(map, match.aId)}${sideSub(map, match.aId) ? ` · ${sideSub(map, match.aId)}` : ""}`} entry={a} />
            <Roster title={`${sideTitle(map, match.bId)}${sideSub(map, match.bId) ? ` · ${sideSub(map, match.bId)}` : ""}`} entry={b} />
          </div>
        </div>

        <Link href={`/sports/${match.sportId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> All {sport?.name.toLowerCase()} matches
        </Link>
      </div>
    </>
  );
}

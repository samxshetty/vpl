"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLiveDB } from "@/lib/store";
import { getSport } from "@/lib/sports";
import { FORMAT_LABEL } from "@/lib/types";
import { entryMap } from "@/lib/derive";
import { entryParts, sortMatches } from "@/lib/format";
import { Bracket } from "@/components/Bracket";
import { Standings } from "@/components/Standings";
import { groupByDay } from "@/components/FixturesView";
import { LiveError, MatchCard, PageSkeleton } from "@/components/PublicBits";

export function SportPublicView({ sportId }: { sportId: string }) {
  const { ready, db } = useLiveDB();
  const router = useRouter();
  const sport = getSport(sportId);
  if (!sport) return null;
  if (!ready) return <PageSkeleton />;

  const map = entryMap(db);
  const entries = db.entries.filter((e) => e.sportId === sportId);
  const matches = db.matches.filter((m) => m.sportId === sportId);
  const playable = sortMatches(matches.filter((m) => !m.bye && m.aId && m.bId));
  const fmt = db.formats[sportId]?.format;
  const groups = groupByDay(playable);

  return (
    <>
      <Link href="/sports" className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white transition-colors mb-8 outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b] rounded">
        <ArrowLeft className="w-4 h-4" /> All disciplines
      </Link>

      <header className="flex items-center gap-6 mb-12">
        <div className="text-7xl drop-shadow-2xl" aria-hidden>{sport.icon}</div>
        <div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white">{sport.name}</h1>
          <p className="max-w-3xl mt-3 text-sm text-white/65 leading-relaxed">{sport.rules}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-semibold text-white/50">
            <span>{sport.kind === "TEAM" ? "Team sport" : "Individual sport"}</span>
            <span className="text-white/20">|</span>
            <span>{fmt ? FORMAT_LABEL[fmt] : "Format not announced"}</span>
          </div>
        </div>
      </header>

      <LiveError />

      {fmt === "ROUND_ROBIN" && (
        <section className="mb-14">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">Standings</h2>
          <Standings matches={matches} entries={entries} />
        </section>
      )}

      {fmt === "KNOCKOUT" && (
        <section className="mb-14">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">Bracket</h2>
          <Bracket matches={matches} entries={entries} onOpen={(m) => router.push(`/matches/${m.id}`)} />
        </section>
      )}

      <section className="mb-14">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">Matches</h2>
        {groups.length === 0 ? (
          <div className="glass-panel px-8 py-12 text-center">
            <p className="text-sm text-white/50 font-sans normal-case">No matches scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((g) => (
              <div key={g.key}>
                <h3 className="text-sm font-semibold text-white/40 mb-3 font-sans normal-case">{g.label}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {g.matches.map((m) => (
                    <MatchCard key={m.id} m={m} map={map} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">
          {sport.kind === "TEAM" ? "Section entries" : "Player entries"} ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-white/40 font-sans normal-case">Registrations haven&apos;t opened yet.</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {entries.map((e) => {
              const p = entryParts(e);
              return (
                <li key={e.id} className="glass-panel px-5 py-4">
                  <div className="text-xl font-display font-bold tracking-tight truncate">{p.title}</div>
                  {p.sub && <div className="text-xs text-white/45 mt-0.5 font-sans normal-case truncate">{p.sub}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

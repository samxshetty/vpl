"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, GitBranch, RefreshCw } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { useStore } from "@/lib/store";
import { SPORTS } from "@/lib/sports";
import type { Match } from "@/lib/types";
import { uid } from "@/lib/format";
import { Button } from "@/components/ui";

const SIZES = [13, 4, 8, 16, 32];

function stageName(round: number, totalRounds: number, size: number) {
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semi-final";
  if (round === totalRounds - 2) return "Quarter-final";
  const entrants = size / 2 ** (round - 1);
  return `Round of ${entrants}`;
}

function makeBracket(sportId: string, entrants: number, venue: string): Match[] {
  const size = 2 ** Math.ceil(Math.log2(entrants));
  const rounds = Math.log2(size);
  const byeCount = size - entrants;
  const matches: Match[] = [];
  const ids: string[][] = [];

  for (let round = 1; round <= rounds; round++) {
    const count = size / 2 ** round;
    ids[round] = Array.from({ length: count }, () => uid(`bracket-${sportId}-r${round}`));
  }

  for (let round = 1; round <= rounds; round++) {
    const count = size / 2 ** round;
    for (let slot = 0; slot < count; slot++) {
      const id = ids[round][slot];
      const nextMatchId = round < rounds ? ids[round + 1][Math.floor(slot / 2)] : undefined;
      const nextSide = round < rounds ? (slot % 2 === 0 ? "A" : "B") : undefined;
      matches.push({
        id,
        sportId,
        format: "KNOCKOUT",
        stage: stageName(round, rounds, size),
        round,
        slot,
        aId: null,
        bId: null,
        startsAt: null,
        venue,
        status: "UPCOMING",
        scoreA: "",
        scoreB: "",
        result: null,
        note: "",
        bye: round === 1 && slot < byeCount,
        nextMatchId,
        nextSide,
      });
    }
  }
  return matches;
}

export function BracketsAdmin() {
  const { ready, db, generateFixtures } = useStore();
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const existing = useMemo(() => {
    const map: Record<string, Match[]> = {};
    for (const sport of SPORTS) map[sport.id] = db.matches.filter((m) => m.sportId === sport.id && m.format === "KNOCKOUT");
    return map;
  }, [db.matches]);

  const generate = (sportId: string) => {
    const sport = SPORTS.find((s) => s.id === sportId);
    if (!sport) return;
    const current = db.matches.filter((m) => m.sportId === sportId);
    if (current.length && !window.confirm(`This will replace all ${current.length} existing match/fixture records for ${sport.name}. Continue?`)) return;
    const entrants = sizes[sportId] ?? 13;
    const capacity = 2 ** Math.ceil(Math.log2(entrants));
    const byeCount = capacity - entrants;
    setBusy(sportId);
    setMessage(null);
    try {
      const bracket = makeBracket(sportId, entrants, sport.defaultVenue);
      generateFixtures(sportId, "KNOCKOUT", bracket, "replace");
      const firstRoundMatches = capacity / 2 - byeCount;
      setMessage(`${sport.name}: generated a ${entrants}-entrant knockout bracket (${firstRoundMatches} first-round matches and ${byeCount} byes, with ${capacity} bracket slots). Fill participants in the sport's Matches tab.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen pb-32">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <header className="mb-8">
          <div className="flex items-center gap-3 text-[#f59e0b] mb-3"><GitBranch className="w-5 h-5" /><span className="text-xs uppercase tracking-[0.2em] font-bold">Tournament setup</span></div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Knockout brackets</h1>
          <p className="text-white/55 mt-3 max-w-3xl">Generate an empty bracket for any sport. Choose the bracket size now, then assign players or teams manually in each sport's match editor. Brackets are saved to Supabase.</p>
        </header>

        {message && <div role="status" className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100">{message}</div>}
        {!ready && <div className="glass-panel p-5 text-white/50">Loading sports and existing matches…</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SPORTS.map((sport) => {
            const allMatches = db.matches.filter((m) => m.sportId === sport.id);
            const knockoutMatches = existing[sport.id] ?? [];
            const hasBracket = knockoutMatches.length > 0;
            const entrants = sizes[sport.id] ?? 13;
            return (
              <section key={sport.id} className="glass-panel p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>{sport.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-display font-bold">{sport.name}</h2>
                    <p className="text-xs text-white/45 mt-1">{sport.kind === "INDIVIDUAL" ? "Individual entries" : "Teams"} · {hasBracket ? `${knockoutMatches.length} bracket matches` : "No bracket generated"}</p>
                  </div>
                  {hasBracket && <span className="text-[10px] uppercase tracking-widest text-emerald-300">Generated</span>}
                </div>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <label className="flex-1 min-w-[130px]">
                    <span className="block text-[11px] uppercase tracking-widest text-white/45 mb-2">Entrants</span>
                    <select value={entrants} onChange={(e) => setSizes((v) => ({ ...v, [sport.id]: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-sm text-white">
                      {SIZES.map((n) => { const slots = 2 ** Math.ceil(Math.log2(n)); const byes = slots - n; const firstRoundGames = slots / 2 - byes; return <option key={n} value={n}>{n} entrants · {firstRoundGames} first-round matches{byes ? ` + ${byes} byes` : ""}</option>; })}
                    </select>
                  </label>
                  <Button variant="primary" onClick={() => generate(sport.id)} disabled={!ready || busy !== null}>
                    {busy === sport.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : hasBracket ? "Regenerate" : "Generate bracket"}
                  </Button>
                </div>
                {allMatches.length > 0 && !hasBracket && <p className="mt-3 flex gap-2 text-xs text-amber-200/80"><AlertTriangle className="w-4 h-4 shrink-0" />Generating replaces this sport's existing match records.</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Link href={`/admin/sports/${sport.id}`} className="text-white/70 hover:text-white underline underline-offset-4">Open sport editor to fill players</Link>
                  {hasBracket && <Link href={`/sports/${sport.id}`} className="text-white/45 hover:text-white underline underline-offset-4">View public sport page</Link>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

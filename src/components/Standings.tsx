"use client";

import type { Entry, Match } from "@/lib/types";
import { standings } from "@/lib/tournament";
import { entryParts } from "@/lib/format";

export function Standings({ matches, entries }: { matches: Match[]; entries: Entry[] }) {
  const ids = Array.from(new Set(matches.flatMap((m) => [m.aId, m.bId]).filter(Boolean) as string[]));
  const rows = standings(matches, ids);
  const byId = new Map(entries.map((e) => [e.id, e]));

  return (
    <div className="glass-panel p-6 sm:p-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Round robin standings</caption>
          <thead className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
            <tr>
              <th scope="col" className="pb-4 font-semibold">Rank</th>
              <th scope="col" className="pb-4 font-semibold">{entries[0]?.kind === "solo" ? "Player" : "Team"}</th>
              <th scope="col" className="pb-4 font-semibold text-center">Played</th>
              <th scope="col" className="pb-4 font-semibold text-center">Won</th>
              <th scope="col" className="pb-4 font-semibold text-center">Drawn</th>
              <th scope="col" className="pb-4 font-semibold text-center">Lost</th>
              <th scope="col" className="pb-4 font-semibold text-right text-[#f59e0b]">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] text-sm">
            {rows.map((r, i) => {
              const p = entryParts(byId.get(r.id));
              return (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 font-numbers text-2xl text-white/60">
                    {i === 0 ? <span className="text-[#f59e0b]">{String(i + 1).padStart(2, "0")}</span> : String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-4">
                    <span className="text-xl font-display font-bold tracking-tight text-white/90">{p.title}</span>
                    {p.sub && <span className="ml-3 text-xs text-white/40">{p.sub}</span>}
                  </td>
                  <td className="py-4 text-center font-numbers text-xl text-white/50">{r.played}</td>
                  <td className="py-4 text-center font-numbers text-xl text-white/50">{r.won}</td>
                  <td className="py-4 text-center font-numbers text-xl text-white/50">{r.drawn}</td>
                  <td className="py-4 text-center font-numbers text-xl text-white/50">{r.lost}</td>
                  <td className="py-4 text-right font-numbers text-3xl text-[#f59e0b]">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/35 mt-5">Three points for a win, one for a draw. Only completed matches count.</p>
    </div>
  );
}

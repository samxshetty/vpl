"use client";

import Link from "next/link";
import { ChevronRight, Activity, Trophy } from "lucide-react";
import { useLiveDB } from "@/lib/store";
import { getSport } from "@/lib/sports";
import { fmtTime, sortMatches } from "@/lib/format";
import { entryMap, overallStandings, recentResults, resultText, scoreText, sideTitle, signed } from "@/lib/derive";
import { LiveError, MatchCard, PageSkeleton } from "@/components/PublicBits";

export function HomeContent() {
  const { ready, db } = useLiveDB();
  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <PageSkeleton />
      </div>
    );
  }

  const map = entryMap(db);
  const live = sortMatches(db.matches.filter((m) => m.status === "LIVE"));
  const upcoming = sortMatches(db.matches.filter((m) => m.status === "UPCOMING" && !m.bye && m.aId && m.bId)).slice(0, 3);
  const table = overallStandings(db).slice(0, 5);
  const results = recentResults(db.matches, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-24">
      <LiveError />

      {/* Live Arenas */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#f59e0b] animate-pulse" />
              <span className="text-[#f59e0b] text-xs font-bold tracking-[0.3em] uppercase">Live Broadcast</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white drop-shadow-lg">ACTIVE ARENAS</h2>
          </div>
        </div>

        {live.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {live.map((m) => {
              const sport = getSport(m.sportId);
              return (
                <Link href={`/matches/${m.id}`} key={m.id} className="group block outline-none">
                  <div className="glass-panel p-0 flex flex-col relative overflow-hidden transition-all duration-500 hover:border-white/20 hover:-translate-y-1">
                    <div className="px-8 py-6 flex justify-between items-center border-b border-white/[0.05] bg-white/[0.02]">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl" aria-hidden>{sport?.icon}</span>
                        <div className="text-xs text-white/50 font-bold uppercase tracking-[0.2em] font-sans">
                          {sport?.name ?? m.sportId} <span className="text-white/20 mx-2">/</span>{" "}
                          <span className="text-white/90">{m.stage}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-white/40 font-mono">{m.venue}</span>
                        <div className="px-3 py-1 rounded border border-[#f59e0b]/50 text-[10px] font-bold text-white bg-[#f59e0b]/20 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full animate-pulse" />
                          Live
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-12">
                      <div className="flex justify-between items-center">
                        <div className="text-center w-1/3 text-5xl md:text-6xl font-display font-bold tracking-tighter text-white break-words">
                          {sideTitle(map, m.aId)}
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <div className="text-3xl md:text-4xl font-numbers font-bold text-[#f59e0b] tracking-wider drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] whitespace-nowrap">
                            {scoreText(m)}
                          </div>
                          <div className="text-xs text-white/40 mt-3 font-mono">Started {fmtTime(m.startsAt)}</div>
                        </div>
                        <div className="text-center w-1/3 text-5xl md:text-6xl font-display font-bold tracking-tighter text-white/50 break-words">
                          {sideTitle(map, m.bId)}
                        </div>
                      </div>
                    </div>

                    <div className="px-8 py-4 bg-black/40 border-t border-white/[0.05] flex justify-between items-center">
                      <div className="text-xs font-medium text-white/60 font-sans">{m.note || "Live now"}</div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-panel px-8 py-10 text-center">
              <h3 className="text-2xl font-display font-bold text-white/90">No live matches right now</h3>
              <p className="text-sm text-white/50 mt-2 font-sans normal-case">
                {upcoming.length > 0 ? "Here's what's coming up next." : "Check back when the next fixtures are set."}
              </p>
            </div>
            {upcoming.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {upcoming.map((m) => (
                  <MatchCard key={m.id} m={m} map={map} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Standings */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 glass-panel p-8 relative overflow-hidden">
          <div className="flex justify-between items-end mb-8 relative z-10 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-[#f59e0b] text-xs font-bold tracking-[0.2em] uppercase font-sans">Championship Race</span>
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-white">OVERALL STANDINGS</h2>
            </div>
            <Link href="/leaderboard" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1 font-sans">
              Full Table <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {table.length === 0 ? (
            <p className="text-sm text-white/50 font-sans normal-case">Standings appear once teams are registered.</p>
          ) : (
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left font-sans">
                <thead className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="pb-4 font-semibold">Rank</th>
                    <th className="pb-4 font-semibold">Franchise</th>
                    <th className="pb-4 font-semibold text-center">Played</th>
                    <th className="pb-4 font-semibold text-center">Diff</th>
                    <th className="pb-4 font-semibold text-right text-[#f59e0b]">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-sm">
                  {table.map((s, i) => (
                    <tr key={s.section} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-5 font-semibold text-white/60">
                        <span className="inline-block w-8 text-center font-numbers text-2xl">
                          {i === 0 ? (
                            <span className="text-[#f59e0b] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">01</span>
                          ) : i === 1 ? (
                            <span className="text-gray-300">02</span>
                          ) : i === 2 ? (
                            <span className="text-amber-700">03</span>
                          ) : (
                            `0${i + 1}`
                          )}
                        </span>
                      </td>
                      <td className="py-5">
                        <span className="text-xl font-display font-bold tracking-tight group-hover:text-white text-white/80 transition-colors">{s.section}</span>
                      </td>
                      <td className="py-5 text-white/40 text-center font-numbers text-xl">{s.played}</td>
                      <td className="py-5 text-white/40 text-center font-numbers text-xl">{signed(s.diff)}</td>
                      <td className="py-5 font-numbers font-bold text-3xl text-[#f59e0b] text-right drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent results */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/50 flex items-center gap-3 mb-2 font-sans">
            <span className="w-1.5 h-1.5 bg-white/20 rounded-full" /> Recent Results
          </h3>

          {results.length === 0 && <p className="text-sm text-white/40 font-sans normal-case">No results yet.</p>}
          {results.map((m) => (
            <Link href={`/matches/${m.id}`} key={m.id} className="glass-panel p-6 group hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="flex justify-between items-center mb-5 font-sans">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{getSport(m.sportId)?.name ?? m.sportId}</span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">Full Time</span>
              </div>
              <div className="flex justify-between items-center mb-5 gap-3">
                <div className="text-2xl font-display font-bold tracking-tighter text-white">{sideTitle(map, m.aId)}</div>
                <div className="text-xs text-white/30 font-mono px-2 py-0.5 rounded border border-white/5 bg-black/40">VS</div>
                <div className="text-2xl font-display font-bold tracking-tighter text-white/50">{sideTitle(map, m.bId)}</div>
              </div>
              <div className="pt-4 border-t border-white/[0.05] flex justify-between items-center gap-3">
                <div className="text-sm font-semibold text-white/80 font-sans normal-case">{resultText(m, map)}</div>
                <div className="text-lg text-white/40 font-numbers tracking-widest whitespace-nowrap">{scoreText(m)}</div>
              </div>
            </Link>
          ))}

          <Link href="/fixtures" className="glass-panel p-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors mt-2 font-sans">
            View All Results
          </Link>
        </div>
      </section>
    </div>
  );
}

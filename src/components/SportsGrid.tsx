"use client";

import Link from "next/link";
import { useLiveDB } from "@/lib/store";
import { SPORTS } from "@/lib/sports";
import { LiveError } from "@/components/PublicBits";

export function SportsGrid() {
  const { db } = useLiveDB();

  return (
    <>
      <LiveError />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 md:gap-x-8 gap-y-12">
        {SPORTS.map((sport) => {
          const matches = db.matches.filter((m) => m.sportId === sport.id && !m.bye);
          const active = matches.filter((m) => m.status === "LIVE").length;
          return (
            <Link key={sport.id} href={`/sports/${sport.id}`} className="group relative block outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b] rounded-3xl">
              <div className={`absolute -inset-0.5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${sport.theme} to-transparent mix-blend-screen`} />
              <div className={`glass-panel p-5 sm:p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br ${sport.theme} to-transparent h-full transition-all duration-500 hover:border-white/20 hover:scale-[1.02] flex flex-col justify-between`}>
                <div className="flex justify-between items-start mb-8 sm:mb-12">
                  <div className="text-4xl sm:text-5xl md:text-7xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform origin-top-left drop-shadow-2xl" aria-hidden>
                    {sport.icon}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">{sport.kind === "TEAM" ? "TEAM EVENT" : "INDIVIDUAL EVENT"}</div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter mb-3 sm:mb-4 text-white/90 group-hover:text-white transition-colors">{sport.name}</h2>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                    {active > 0 ? (
                      <span className="flex items-center gap-2 text-[#f59e0b]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                        {active} Live
                      </span>
                    ) : (
                      <span>No Live Games</span>
                    )}
                    <span className="text-white/20">|</span>
                    <span>{matches.length} Matches</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

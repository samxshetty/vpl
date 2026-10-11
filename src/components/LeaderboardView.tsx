"use client";

import clsx from "clsx";
import { useLiveDB } from "@/lib/store";
import { overallStandings, signed } from "@/lib/derive";
import { LiveError, PageSkeleton } from "@/components/PublicBits";

const FORM_STYLE = {
  W: "bg-emerald-500/20 text-emerald-300",
  L: "bg-red-500/20 text-red-300",
  D: "bg-gray-500/20 text-gray-400",
} as const;

export function LeaderboardView() {
  const { ready, db } = useLiveDB();
  if (!ready) return <PageSkeleton />;
  const rows = overallStandings(db);

  return (
    <>
      <LiveError />
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400 font-sans normal-case">The table appears once teams are registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm md:text-base">
              <thead className="text-xs text-gray-500 uppercase tracking-wider bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Rank</th>
                  <th className="px-6 py-4 font-medium">Section Franchise</th>
                  <th className="px-6 py-4 font-medium text-center">Matches</th>
                  <th className="px-6 py-4 font-medium text-center">W-D-L</th>
                  <th className="px-6 py-4 font-medium text-center">Form Guide</th>
                  <th className="px-6 py-4 font-medium text-center">Net Diff</th>
                  <th className="px-6 py-4 font-bold text-[#f59e0b] text-right">VPL Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((s, i) => (
                  <tr key={s.section} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5 font-bold text-gray-300">
                      <span className="inline-block w-6 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                    </td>
                    <td className="px-6 py-5 font-bold text-lg group-hover:text-[#f59e0b] transition-colors">{s.section}</td>
                    <td className="px-6 py-5 text-gray-400 text-center">{s.played}</td>
                    <td className="px-6 py-5 text-gray-400 text-center font-mono">
                      {s.won}-{s.drawn}-{s.lost}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1.5 justify-center">
                        {s.form.length === 0 && <span className="text-gray-600">–</span>}
                        {s.form.map((f, j) => (
                          <span key={j} className={clsx("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold", FORM_STYLE[f])}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-center font-mono">{signed(s.diff)}</td>
                    <td className="px-6 py-5 font-bold text-2xl text-[#f59e0b] text-right font-mono tracking-tighter">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs text-gray-500 text-center font-sans normal-case">
        Championship points follow the VPL rulebook only: Team events 15 / 10 / 5 / 5; individual events 7 / 4 / 2 / 2. Match results are statistics only and do not add points.
      </p>
    </>
  );
}

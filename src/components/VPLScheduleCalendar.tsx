"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { VPL_2026_SCHEDULE, type OfficialSportSchedule } from "@/lib/vpl-2026";
import { getSupabase } from "@/lib/supabase/client";

type ScheduleRow = {
  sport_id: string;
  sport_name: string;
  icon: string;
  start_date: string;
  end_date: string;
  categories: string;
  sport_kind: "TEAM" | "INDIVIDUAL";
};

function formatDates(start: string, end: string) {
  const dateOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", timeZone: "UTC" };
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  if (start === end) return a.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();
  if (sameMonth) return `${a.getUTCDate()}–${b.getUTCDate()} ${b.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}`;
  return `${a.toLocaleDateString("en-GB", dateOptions)} – ${b.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
}

function mapRow(row: ScheduleRow): OfficialSportSchedule {
  return {
    sportId: row.sport_id,
    name: row.sport_name,
    icon: row.icon,
    dates: formatDates(row.start_date, row.end_date),
    startDate: row.start_date,
    endDate: row.end_date,
    categories: row.categories,
    kind: row.sport_kind,
  };
}

export function VPLScheduleCalendar() {
  const [schedule, setSchedule] = useState<OfficialSportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let channel: RealtimeChannel | null = null;
    const supabase = getSupabase();

    if (!supabase) {
      setSchedule(VPL_2026_SCHEDULE);
      setError("Supabase is not configured; showing the built-in schedule.");
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data, error: queryError } = await supabase
        .from("sport_schedule")
        .select("sport_id, sport_name, icon, start_date, end_date, categories, sport_kind")
        .order("start_date", { ascending: true })
        .order("sport_name", { ascending: true });

      if (!active) return;
      if (queryError) {
        setError(`Could not load the Supabase schedule (${queryError.message}). Showing the built-in schedule instead.`);
        setSchedule(VPL_2026_SCHEDULE);
      } else {
        setError(null);
        setSchedule(((data ?? []) as ScheduleRow[]).map(mapRow));
      }
      setLoading(false);
    };

    void load();
    channel = supabase
      .channel("vpl-sport-schedule")
      .on("postgres_changes", { event: "*", schema: "public", table: "sport_schedule" }, () => void load())
      .subscribe();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {error && (
        <p role="status" className="mx-5 md:mx-8 mt-4 text-xs text-amber-200/80">
          {error}
        </p>
      )}
      {loading ? (
        <div className="p-8 space-y-4" aria-busy="true" aria-label="Loading tournament schedule">
          {[1, 2, 3].map((n) => <div key={n} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : schedule.length === 0 ? (
        <div className="p-8 text-center text-sm text-white/55">No sports have been added to the schedule yet.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {schedule.map((item) => (
            <div key={item.sportId} className="grid grid-cols-[auto_1fr] md:grid-cols-[minmax(180px,1fr)_minmax(220px,1.3fr)_minmax(180px,1fr)] gap-4 items-center p-5 md:px-8 hover:bg-white/[0.025]">
              <div className="flex items-center gap-3"><span className="text-2xl" aria-hidden>{item.icon}</span><span className="font-bold">{item.name}</span></div>
              <div><div className="font-semibold text-[#f59e0b]">{item.dates}</div><div className="text-xs text-white/40 mt-1">{item.categories}</div></div>
              <div className="hidden md:block text-right"><span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 rounded-full px-3 py-1">{item.kind === "INDIVIDUAL" ? "Individual" : "Team event"}</span></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

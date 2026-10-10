"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { VPLScheduleCalendar } from "@/components/VPLScheduleCalendar";
import { FixturesView } from "@/components/FixturesView";

type PageTab = "calendar" | "upcoming";
type MatchStatusFilter = "ALL" | "LIVE" | "UPCOMING" | "COMPLETED";

const tabClass = (active: boolean) =>
  `px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-[0.16em] transition-colors border-b-2 ${
    active ? "border-[#f59e0b] text-[#f59e0b]" : "border-transparent text-white/45 hover:text-white"
  }`;

export default function Fixtures() {
  const [activeTab, setActiveTab] = useState<PageTab>("calendar");
  const [initialFilter, setInitialFilter] = useState<MatchStatusFilter>("UPCOMING");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "upcoming" || requested === "finished") setActiveTab("upcoming");
    if (requested === "finished") setInitialFilter("COMPLETED");
  }, []);

  return (
    <main className="min-h-screen pb-20">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        <div className="mb-8 sm:mb-10 text-center">
          <p className="text-[#f59e0b] text-xs font-bold uppercase tracking-[0.25em] mb-3">VISTA Premier League · ISE</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">FIXTURES</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Browse the official tournament calendar or explore confirmed match fixtures and results.</p>
        </div>

        <div className="mb-8 flex justify-center border-b border-white/10" role="tablist" aria-label="Fixtures views">
          <button type="button" role="tab" aria-selected={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} className={tabClass(activeTab === "calendar")}>Calendar</button>
          <button type="button" role="tab" aria-selected={activeTab === "upcoming"} onClick={() => setActiveTab("upcoming")} className={tabClass(activeTab === "upcoming")}>Upcoming Fixtures</button>
        </div>

        {activeTab === "calendar" ? (
          <section className="glass-panel rounded-3xl overflow-hidden mb-16">
            <div className="p-5 sm:p-8 border-b border-white/10">
              <h2 className="text-2xl font-bold">Tournament calendar</h2>
              <p className="text-sm text-white/50 mt-2">12 October – 11 November 2026</p>
            </div>
            <VPLScheduleCalendar />
          </section>
        ) : (
          <section id="upcoming-fixtures" className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Upcoming fixtures & results</h2>
              <p className="text-sm text-white/50 mt-2">Filter matches by status or sport.</p>
            </div>
            <FixturesView key={initialFilter} initialStatus={initialFilter} />
          </section>
        )}
      </div>
    </main>
  );
}

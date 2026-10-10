import { NavBar } from "@/components/NavBar";
import { FixturesView } from "@/components/FixturesView";
import { VPLScheduleCalendar } from "@/components/VPLScheduleCalendar";

export default function Fixtures() {
  return (
    <main className="min-h-screen pb-20">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-10 text-center">
          <p className="text-[#f59e0b] text-xs font-bold uppercase tracking-[0.25em] mb-3">VISTA Premier League · ISE</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">VPL 2026 SCHEDULE</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Official sport dates from the published schedule. Individual match pairings, times and brackets will appear when confirmed.</p>
        </div>
        <section className="glass-panel rounded-3xl overflow-hidden mb-16">
          <div className="p-6 md:p-8 border-b border-white/10">
            <h2 className="text-2xl font-bold">Tournament calendar</h2>
            <p className="text-sm text-white/50 mt-2">12 October – 11 November 2026</p>
          </div>
          <VPLScheduleCalendar />
        </section>
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Match centre</h2>
          <p className="text-gray-400">Confirmed fixtures and results from the live database.</p>
        </div>
        <FixturesView />
      </div>
    </main>
  );
}

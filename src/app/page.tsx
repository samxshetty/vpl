import { NavBar } from "@/components/NavBar";
import { FixturesView } from "@/components/FixturesView";
import { LiveMatchesSection } from "@/components/LiveMatchesSection";

export default function SportsHub() {
  return (
    <main className="min-h-screen pb-32 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[#990000]/10 blur-[150px] rounded-full opacity-50 mix-blend-screen translate-x-1/3" />
      </div>

      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-16 text-center">
          <p className="text-sm md:text-base font-semibold uppercase tracking-[0.35em] text-white/60 mb-4">VISTA PRESENTS</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">VISTA PREMIER LEAGUE</h1>
        </div>
        <LiveMatchesSection />
        <section className="mt-2" aria-labelledby="match-centre-heading">
          <div className="mb-8">
            <p className="text-[#f59e0b] text-xs font-bold uppercase tracking-[0.25em] mb-3">Fixtures · Live scores · Results</p>
            <h2 id="match-centre-heading" className="text-3xl md:text-4xl font-bold tracking-tighter text-white">MATCH CENTRE</h2>
            <p className="mt-2 text-sm text-white/50 font-sans normal-case">Follow every confirmed fixture, live match, and final result across VPL 2026.</p>
          </div>
          <FixturesView mode="preview" />
        </section>
      </div>
    </main>
  );
}

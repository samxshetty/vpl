import { NavBar } from "@/components/NavBar";
import { LeaderboardView } from "@/components/LeaderboardView";

export default function Leaderboard() {
  return (
    <main className="min-h-screen pb-20">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">LEADERBOARD</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">The overall department standings across all disciplines, updated live as results come in.</p>
        </div>
        <LeaderboardView />
      </div>
    </main>
  );
}

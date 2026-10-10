import { NavBar } from "@/components/NavBar";
import { Trophy, Users, ShieldCheck } from "lucide-react";
import { VPL_2026_GENERAL_RULES } from "@/lib/vpl-2026";

const sportRules = [
  { name: "Cricket", detail: "Men’s teams: 11 players (8 main + 3 substitutes). Knockout matches are 4 overs; semi-finals and finals are 5 overs. Women’s teams: 8 players (6 primary + 2 substitutes); knockouts are 3 overs and semi-finals/finals are 4 overs. Tennis balls are used." },
  { name: "Basketball", detail: "Men’s teams have 7 players (5 active + 2 substitutes). Matches last 10 minutes, split into two 5-minute quarters. Venue: basketball court near Sanmathi Garden." },
  { name: "Throw Ball", detail: "Women’s teams have 9 players (7 active + 2 substitutes). Matches are best of 3 sets, each to 15 points. Venue: throwball court near the Main Hostel Grounds." },
  { name: "Football", detail: "Men’s teams have 11 players (7 active + 4 substitutes). Matches last 14 minutes (two 7-minute halves); a 3-round penalty shootout breaks a tie. Semi-finals and finals include 3 minutes of extra time if tied. Venue: B.C. Alva Football Ground." },
  { name: "Volleyball", detail: "Men’s teams have 9 players (6 active + 3 substitutes). Knockout matches are 1 set to 25 points; semi-finals and finals are 3 sets to 15 points. Venue: court near the Gents Hostel." },
  { name: "Badminton", detail: "Men’s singles, women’s singles and mixed doubles. Until the semi-finals, matches are one game to 21 points. Semi-finals and finals are best of 3 games to 15 points each. Rally-point scoring applies, with a 2-point lead subject to the applicable maximum score. Players are requested to bring their own equipment." },
  { name: "Chess", detail: "Men’s and women’s divisions; 5 minutes per player. One student per category from each section. Players must bring their own chess board and pieces. Venue: APJ 5th floor." },
  { name: "Carrom", detail: "Men’s and women’s categories; two players per team, playing two-on-two (Black and White). Each section may enter one team for each category. Venue: APJ Block, 5th Floor." },
  { name: "4×100 m Relay", detail: "Four athletes per team, each running 100 m. Runners must stay in their assigned lane. Teams choose their running order." },
  { name: "Tug of War", detail: "Eight players per side for men and six per side for women. Best of three pulls wins. Locking (elbow below knee), sitting and lying down are fouls." },
  { name: "Dodgeball", detail: "Women’s teams have 6 players. Each match lasts 4 minutes. A player is out if hit by the ball below the waist before it touches the ground; hits to the upper body or head do not count. Stay within court boundaries and do not cross the centre line. The team eliminating all opponents or with more players remaining at time wins." },
];

export default function Rules() {
  return (
    <main className="min-h-screen pb-32 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden"><div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-accent-red/10 blur-[150px] rounded-full opacity-50 mix-blend-screen transform -translate-y-1/2" /></div>
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        <section className="text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent-gold">VISTA Premier League · ISE</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-glow">VPL 2026 RULES</h1>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">Rules and scoring transcribed from the supplied VPL 2026 rules and regulations document. Organizers may announce sport-rule changes on match day.</p>
        </section>
        <section className="grid md:grid-cols-2 gap-5">
          {VPL_2026_GENERAL_RULES.map((rule) => <div key={rule} className="glass-panel rounded-2xl p-6 flex gap-4"><ShieldCheck className="w-5 h-5 text-accent-gold shrink-0 mt-1" /><p className="text-white/75 leading-relaxed">{rule}</p></div>)}
        </section>
        <section className="glass-panel rounded-3xl p-6 md:p-10">
          <div className="text-center mb-8"><Trophy className="w-8 h-8 text-accent-gold mx-auto mb-3" /><h2 className="text-3xl md:text-4xl font-bold tracking-tight">POINTS SYSTEM</h2><p className="text-sm text-white/50 mt-2">Overall class championship</p></div>
          <div className="overflow-x-auto"><table className="w-full text-center"><thead><tr className="text-xs uppercase tracking-widest text-white/50 border-b border-white/10"><th className="text-left p-4">Sport type</th><th className="p-4">Winner</th><th className="p-4">Runner-up</th><th className="p-4">Semi-finalists</th></tr></thead><tbody className="text-lg font-bold divide-y divide-white/5"><tr><td className="text-left p-4">Individual (Chess)</td><td className="p-4 text-accent-gold">7</td><td className="p-4">4</td><td className="p-4 text-white/60">2</td></tr><tr><td className="text-left p-4">Team games</td><td className="p-4 text-accent-gold">15</td><td className="p-4">10</td><td className="p-4 text-white/60">5</td></tr></tbody></table></div>
          <p className="text-sm text-white/50 text-center mt-6">The class accumulating the most points across all events becomes the Overall Champion.</p>
        </section>
        <section>
          <div className="mb-6"><h2 className="text-3xl font-bold">Sport-specific rules</h2><p className="text-white/50 mt-2">The details below reflect the supplied rulebook; any omitted details are not inferred.</p></div>
          <div className="space-y-3">{sportRules.map((sport) => <details key={sport.name} className="glass-panel rounded-2xl group"><summary className="cursor-pointer list-none p-5 md:p-6 flex items-center justify-between gap-4"><span className="font-bold text-lg">{sport.name}</span><span className="text-accent-gold text-xl group-open:rotate-45 transition-transform">+</span></summary><p className="px-5 md:px-6 pb-6 text-white/65 leading-relaxed">{sport.detail}</p></details>)}</div>
        </section>
        <section className="glass-panel rounded-2xl p-6"><div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-accent-gold" /><h2 className="text-xl font-bold">Eligibility and conduct</h2></div><p className="text-white/65 leading-relaxed">The supplied rulebook says events are open to ISE students who have remitted the VISTA Fund. Participants must carry ID cards, respect umpire decisions and arrive on time.</p></section>
      </div>
    </main>
  );
}

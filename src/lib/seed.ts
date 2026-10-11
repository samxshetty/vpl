import type { DB, Entry, Match, Player, TeamEntry } from "./types";
import { SPORTS } from "./sports";
import { buildKnockout, buildRoundRobin, buildSingle, type ScheduleOpts } from "./scheduler";
import { propagateWinner } from "./tournament";

const FIRST = ["Aarav", "Vihaan", "Aditya", "Rohan", "Karthik", "Manish", "Vignesh", "Praneeth", "Darshan", "Nikhil", "Arjun", "Sahil", "Harsh", "Pranav", "Rahul", "Siddharth", "Varun", "Tejas", "Akash", "Dhruv", "Ishaan", "Kunal", "Naveen", "Omkar", "Rakesh", "Suraj", "Yash", "Abhay", "Chetan", "Deepak"];
const LAST = ["Kumar", "Shetty", "Rao", "Bhat", "Nayak", "Hegde", "Pai", "Kamath", "Shenoy", "Naik", "Gowda", "Reddy", "Patil", "Joshi", "Acharya", "Poojary", "Salian", "Kini", "Prabhu", "Holla"];
const BRANCH = ["CS", "EC", "ME", "IS", "AI", "CV"];

const SECTIONS: Array<{ section: string; team: string }> = [
  { section: "3A", team: "Thunder Hawks" },
  { section: "3B", team: "Blue Blazers" },
  { section: "5A", team: "Iron Wolves" },
  { section: "5B", team: "Royal Strikers" },
  { section: "5C", team: "Crimson Kings" },
  { section: "7A", team: "Phoenix Rising" },
  { section: "7B", team: "Night Riders" },
  { section: "7C", team: "Storm Breakers" },
];

const ROSTER_SIZE: Record<string, number> = {
  cricket: 12,
  football: 11,
  basketball: 8,
  volleyball: 7,
  throwball: 8,
  "tug-of-war": 8,
  "mixed-relay": 4,
};
const TEAMS_PER_SPORT: Record<string, number> = {
  cricket: 6,
  football: 8,
  basketball: 6,
  volleyball: 6,
  throwball: 4,
  "tug-of-war": 4,
  "mixed-relay": 4,
};
const SOLOS_PER_SPORT: Record<string, number> = { badminton: 8, chess: 6, carrom: 8 };

let counter = 0;
function person(): { name: string; usn: string } {
  const i = counter++;
  const name = `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 11 + 3) % LAST.length]}`;
  const usn = `1VP23${BRANCH[i % BRANCH.length]}${String(100 + ((i * 37) % 900)).padStart(3, "0")}`;
  return { name, usn };
}

function buildEntries(): Entry[] {
  counter = 0;
  const entries: Entry[] = [];
  for (const sport of SPORTS) {
    if (sport.kind === "TEAM") {
      SECTIONS.slice(0, TEAMS_PER_SPORT[sport.id]).forEach((s) => {
        const players: Player[] = Array.from({ length: ROSTER_SIZE[sport.id] }, () => {
          const p = person();
          return { id: `p_${counter}`, ...p };
        });
        const t: TeamEntry = {
          kind: "team",
          id: `e_${sport.id}_${s.section}`,
          sportId: sport.id,
          name: s.team,
          section: s.section,
          players,
        };
        entries.push(t);
      });
    } else {
      const classes = SECTIONS.map((s) => s.section);
      for (let i = 0; i < SOLOS_PER_SPORT[sport.id]; i++) {
        const p = person();
        entries.push({
          kind: "solo",
          id: `e_${sport.id}_${i + 1}`,
          sportId: sport.id,
          name: p.name,
          usn: p.usn,
          className: classes[(i * 3) % classes.length],
        });
      }
    }
  }
  return entries;
}

function opts(date: string, time: string, venues: string[], duration = 90): ScheduleOpts {
  return { startDate: date, startTime: time, endTime: "17:00", durationMin: duration, gapMin: 15, venues };
}

function finish(m: Match, result: "A" | "B" | "DRAW", scoreA: string, scoreB: string, note: string): Match {
  return { ...m, status: "COMPLETED", result, scoreA, scoreB, note };
}

export function buildSeed(): DB {
  const entries = buildEntries();
  const ids = (sportId: string) => entries.filter((e) => e.sportId === sportId).map((e) => e.id);
  const now = "2026-10-10T00:00:00.000Z";

  // Cricket — round robin, a few already played, one live.
  let cricket = buildRoundRobin("cricket", ids("cricket"), opts("2026-10-10", "09:00", ["Main Ground"], 120), false);
  cricket = cricket.map((m, i) => {
    if (i === 0) return finish(m, "A", "148/6", "142/9", "Won by 6 runs");
    if (i === 1) return finish(m, "B", "121/8", "122/4", "Won by 6 wickets");
    if (i === 2) return { ...m, status: "LIVE" as const, scoreA: "112/4", scoreB: "", note: "Innings 1, 13.1 ov" };
    return m;
  });

  // Football — knockout of 8 with the first round under way.
  let football = buildKnockout("football", ids("football"), opts("2026-10-11", "10:00", ["Quadrangle Court", "Main Ground"], 60));
  const f0 = football.find((m) => m.round === 1 && m.slot === 0)!;
  const f0done = finish(f0, "A", "2", "1", "");
  football = propagateWinner(football.map((m) => (m.id === f0.id ? f0done : m)), f0done);
  const f1 = football.find((m) => m.round === 1 && m.slot === 1)!;
  const f1done = finish(f1, "B", "0", "3", "");
  football = propagateWinner(football.map((m) => (m.id === f1.id ? f1done : m)), f1done);

  // Chess — knockout of 6 (two byes), nothing played yet.
  const chess = buildKnockout("chess", ids("chess"), opts("2026-10-12", "10:00", ["Indoor Hall"], 45));

  // Badminton — a single exhibition match.
  const [b1, b2] = ids("badminton");
  const badminton = buildSingle("badminton", b1, b2, opts("2026-10-12", "15:00", ["Indoor Hall"], 45));

  return {
    entries,
    matches: [...cricket, ...football, ...chess, badminton],
    awards: {},
    formats: {
      cricket: { format: "ROUND_ROBIN", updatedAt: now },
      football: { format: "KNOCKOUT", updatedAt: now },
      chess: { format: "KNOCKOUT", updatedAt: now },
      badminton: { format: "SINGLE", updatedAt: now },
    },
  };
}

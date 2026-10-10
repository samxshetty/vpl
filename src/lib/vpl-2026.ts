export type OfficialSportSchedule = {
  sportId: string;
  name: string;
  icon: string;
  dates: string;
  startDate: string;
  endDate: string;
  categories: string;
  kind: "TEAM" | "INDIVIDUAL";
};

// Transcribed from the VPL 2026 schedule/rules documents supplied by the organizer.
// No team draws, player entries, kickoff times, or match results are inferred here.
export const VPL_2026_SCHEDULE: OfficialSportSchedule[] = [
  { sportId: "chess", name: "Chess", icon: "♟️", dates: "12–13 October 2026", startDate: "2026-10-12", endDate: "2026-10-13", categories: "Men’s and women’s", kind: "INDIVIDUAL" },
  { sportId: "carrom", name: "Carrom", icon: "🎯", dates: "14–15 October 2026", startDate: "2026-10-14", endDate: "2026-10-15", categories: "Men’s and women’s", kind: "TEAM" },
  { sportId: "volleyball", name: "Volleyball", icon: "🏐", dates: "16–20 October 2026", startDate: "2026-10-16", endDate: "2026-10-20", categories: "Men’s", kind: "TEAM" },
  { sportId: "throwball", name: "Throw Ball", icon: "🥎", dates: "16–20 October 2026", startDate: "2026-10-16", endDate: "2026-10-20", categories: "Women’s", kind: "TEAM" },
  { sportId: "football", name: "Football", icon: "⚽", dates: "22–24 October 2026", startDate: "2026-10-22", endDate: "2026-10-24", categories: "Men’s", kind: "TEAM" },
  { sportId: "badminton", name: "Badminton", icon: "🏸", dates: "26–28 October 2026", startDate: "2026-10-26", endDate: "2026-10-28", categories: "Men’s singles, women’s singles, mixed doubles", kind: "INDIVIDUAL" },
  { sportId: "dodgeball", name: "Dodgeball", icon: "🤾", dates: "5–6 November 2026", startDate: "2026-11-05", endDate: "2026-11-06", categories: "Women’s", kind: "TEAM" },
  { sportId: "basketball", name: "Basketball", icon: "🏀", dates: "5–6 November 2026", startDate: "2026-11-05", endDate: "2026-11-06", categories: "Men’s", kind: "TEAM" },
  { sportId: "cricket", name: "Cricket", icon: "🏏", dates: "7 November 2026", startDate: "2026-11-07", endDate: "2026-11-07", categories: "Men’s and women’s", kind: "TEAM" },
  { sportId: "mixed-relay", name: "4×100 m Relay", icon: "🏃", dates: "9 November 2026", startDate: "2026-11-09", endDate: "2026-11-09", categories: "Men’s and women’s", kind: "TEAM" },
  { sportId: "tug-of-war", name: "Tug of War", icon: "🪢", dates: "9–11 November 2026", startDate: "2026-11-09", endDate: "2026-11-11", categories: "Men’s and women’s", kind: "TEAM" },
];

export const VPL_2026_GENERAL_RULES = [
  "All participants must carry their ID cards throughout the event.",
  "Umpires’ decisions are final and must be respected by all players.",
  "Events are open to ISE students who have remitted the VISTA Fund.",
  "Teams not present at their scheduled time may be disqualified.",
  "Any changes to a sport’s rules will be announced on the day of the matches.",
];

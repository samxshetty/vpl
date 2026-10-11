export type SportKind = "TEAM" | "INDIVIDUAL";
export type FormatType = "ROUND_ROBIN" | "KNOCKOUT" | "SINGLE";
export type MatchStatus = "UPCOMING" | "LIVE" | "COMPLETED";
export type MatchResult = "A" | "B" | "DRAW" | null;

export interface Sport {
  id: string;
  name: string;
  icon: string;
  kind: SportKind;
  theme: string; // tailwind gradient "from-*" class, same as the user site
  defaultVenue: string;
  rules: string;
  /** Total registered roster size including substitutes, when the rulebook specifies it. */
  rosterSize?: number;
}

export interface Player {
  id: string;
  name: string;
  usn: string;
}

/** A team entry: team name + section + roster (name & USN). */
export interface TeamEntry {
  kind: "team";
  id: string;
  sportId: string;
  name: string;
  section: string;
  players: Player[];
}

/** An individual entry: name + USN + class. */
export interface SoloEntry {
  kind: "solo";
  id: string;
  sportId: string;
  name: string;
  usn: string;
  className: string;
}

export type Entry = TeamEntry | SoloEntry;

export interface Match {
  id: string;
  sportId: string;
  format: FormatType;
  stage: string; // "Round 1", "Semi-final", "Match 3" ...
  round: number;
  slot: number; // position inside the round (knockout bracket order)
  aId: string | null; // null = TBD (waiting on an earlier match) or removed
  bId: string | null;
  startsAt: string | null; // local "YYYY-MM-DDTHH:mm"
  venue: string;
  status: MatchStatus;
  scoreA: string;
  scoreB: string;
  result: MatchResult;
  note: string;
  bye?: boolean;
  nextMatchId?: string;
  nextSide?: "A" | "B";
}

export interface SportFormat {
  format: FormatType;
  updatedAt: string;
}

/** Final championship placements for one sport. Points are derived from the rulebook, never stored as editable values. */
export interface SportAward {
  sportId: string;
  winnerEntryId: string | null;
  runnerUpEntryId: string | null;
  semifinalistAEntryId: string | null;
  semifinalistBEntryId: string | null;
  updatedAt: string;
}

export interface DB {
  entries: Entry[];
  matches: Match[];
  formats: Record<string, SportFormat>;
  awards: Record<string, SportAward>;
}

export const FORMAT_LABEL: Record<FormatType, string> = {
  ROUND_ROBIN: "Round robin",
  KNOCKOUT: "Knockout",
  SINGLE: "Single match",
};

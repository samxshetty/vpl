import type { Entry, FormatType, Match, MatchResult, MatchStatus, Player } from "./types";

/* Row shapes as they come back from Supabase (snake_case). */

export interface EntryRow {
  id: string;
  sport_id: string;
  kind: "team" | "solo";
  name: string;
  section: string | null;
  players: Player[] | null;
  usn: string | null;
  class_name: string | null;
}

export interface MatchRow {
  id: string;
  sport_id: string;
  format: FormatType;
  stage: string;
  round: number;
  slot: number;
  a_id: string | null;
  b_id: string | null;
  starts_at: string | null;
  venue: string;
  status: MatchStatus;
  score_a: string;
  score_b: string;
  result: MatchResult;
  note: string;
  bye: boolean;
  next_match_id: string | null;
  next_side: "A" | "B" | null;
}

export interface FormatRow {
  sport_id: string;
  format: FormatType;
  updated_at: string;
}

export function entryFromRow(r: EntryRow): Entry {
  if (r.kind === "team") {
    return { kind: "team", id: r.id, sportId: r.sport_id, name: r.name, section: r.section ?? "", players: r.players ?? [] };
  }
  return { kind: "solo", id: r.id, sportId: r.sport_id, name: r.name, usn: r.usn ?? "", className: r.class_name ?? "" };
}

export function entryToRow(e: Entry): EntryRow {
  return e.kind === "team"
    ? { id: e.id, sport_id: e.sportId, kind: "team", name: e.name, section: e.section, players: e.players, usn: null, class_name: null }
    : { id: e.id, sport_id: e.sportId, kind: "solo", name: e.name, section: null, players: [], usn: e.usn, class_name: e.className };
}

export function matchFromRow(r: MatchRow): Match {
  const m: Match = {
    id: r.id,
    sportId: r.sport_id,
    format: r.format,
    stage: r.stage,
    round: r.round,
    slot: r.slot,
    aId: r.a_id,
    bId: r.b_id,
    startsAt: r.starts_at,
    venue: r.venue,
    status: r.status,
    scoreA: r.score_a,
    scoreB: r.score_b,
    result: r.result,
    note: r.note,
  };
  if (r.bye) m.bye = true;
  if (r.next_match_id) m.nextMatchId = r.next_match_id;
  if (r.next_side) m.nextSide = r.next_side;
  return m;
}

export function matchToRow(m: Match): MatchRow {
  return {
    id: m.id,
    sport_id: m.sportId,
    format: m.format,
    stage: m.stage,
    round: m.round,
    slot: m.slot,
    a_id: m.aId,
    b_id: m.bId,
    starts_at: m.startsAt,
    venue: m.venue,
    status: m.status,
    score_a: m.scoreA,
    score_b: m.scoreB,
    result: m.result,
    note: m.note,
    bye: Boolean(m.bye),
    next_match_id: m.nextMatchId ?? null,
    next_side: m.nextSide ?? null,
  };
}

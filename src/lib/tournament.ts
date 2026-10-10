import type { Match } from "./types";
import { winnerId } from "./format";

/** After a knockout match changes, push its winner (or clear the slot) into the next round. */
export function propagateWinner(matches: Match[], changed: Match): Match[] {
  if (changed.format !== "KNOCKOUT" || !changed.nextMatchId) return matches;

  const nextMatches = matches.map((m) => ({ ...m }));
  const byId = new Map(nextMatches.map((m) => [m.id, m]));
  const queue: Match[] = [changed];
  const visited = new Set<string>();

  while (queue.length) {
    const source = queue.shift()!;
    if (visited.has(source.id) || source.format !== "KNOCKOUT" || !source.nextMatchId) continue;
    visited.add(source.id);
    const target = byId.get(source.nextMatchId);
    if (!target) continue;

    const winner = source.status === "COMPLETED" ? winnerId(source) : null;
    const side = source.nextSide;
    if (!side) continue;
    const oldParticipant = side === "A" ? target.aId : target.bId;
    if (oldParticipant === winner) continue;

    if (side === "A") target.aId = winner;
    else target.bId = winner;

    // A changed participant invalidates any result already recorded in that downstream match.
    target.status = "UPCOMING";
    target.scoreA = "";
    target.scoreB = "";
    target.result = null;
    target.note = target.bye ? "Bye" : "";
    queue.push(target);
  }

  return nextMatches;
}

export interface StandingRow {
  id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

/** 3 points for a win, 1 for a draw. Only round-robin matches count. */
export function standings(matches: Match[], ids: string[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    ids.map((id) => [id, { id, played: 0, won: 0, drawn: 0, lost: 0, points: 0 }])
  );
  for (const m of matches) {
    if (m.format !== "ROUND_ROBIN" || m.status !== "COMPLETED" || !m.aId || !m.bId || !m.result) continue;
    const a = rows.get(m.aId);
    const b = rows.get(m.bId);
    if (!a || !b) continue;
    a.played++;
    b.played++;
    if (m.result === "DRAW") {
      a.drawn++;
      b.drawn++;
      a.points += 1;
      b.points += 1;
    } else if (m.result === "A") {
      a.won++;
      b.lost++;
      a.points += 3;
    } else {
      b.won++;
      a.lost++;
      b.points += 3;
    }
  }
  return [...rows.values()].sort((x, y) => y.points - x.points || y.won - x.won || x.lost - y.lost);
}

/** Warnings for a match being saved: same venue at the same start time, or the same side booked twice. */
export function findConflicts(draft: Match, all: Match[]): string[] {
  if (!draft.startsAt) return [];
  const others = all.filter((m) => m.id !== draft.id && m.startsAt === draft.startsAt && m.status !== "COMPLETED");
  const out: string[] = [];
  if (draft.venue && others.some((m) => m.venue.trim().toLowerCase() === draft.venue.trim().toLowerCase())) {
    out.push(`Another match is already booked at ${draft.venue} at this time.`);
  }
  const sides = [draft.aId, draft.bId].filter(Boolean) as string[];
  if (others.some((m) => sides.includes(m.aId ?? "") || sides.includes(m.bId ?? ""))) {
    out.push("One of these sides already has a match at this time.");
  }
  return out;
}

import type { DB, Entry, Match } from "./types";
import { entryParts, sortMatches } from "./format";

export type EntryMap = Map<string, Entry>;

export const entryMap = (db: DB): EntryMap => new Map(db.entries.map((e) => [e.id, e]));

/** Big label for a side of a match: a team's section ("3A") or a player's name. */
export const sideTitle = (map: EntryMap, id: string | null) => entryParts(id ? map.get(id) : null).title;

export const sideSub = (map: EntryMap, id: string | null) => entryParts(id ? map.get(id) : null).sub;

/** Section a side plays for: the section of a team, or the class of an individual player. */
function sectionOf(e: Entry | undefined): string {
  if (!e) return "";
  return (e.kind === "team" ? e.section : e.className).trim().toUpperCase();
}

export interface SectionRow {
  section: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  /** wins minus losses */
  diff: number;
  /** last five results, oldest first */
  form: Array<"W" | "D" | "L">;
}

/**
 * Overall department table, across every discipline.
 * Every finished match counts: 3 points for a win, 1 each for a draw, 0 for a loss.
 * Sides are grouped by section (a team's section, or an individual player's class).
 * Byes and matches between two sides of the same section are ignored.
 */
export function overallStandings(db: DB): SectionRow[] {
  const byId = entryMap(db);
  const rows = new Map<string, SectionRow>();
  const row = (section: string) => {
    let r = rows.get(section);
    if (!r) {
      r = { section, played: 0, won: 0, drawn: 0, lost: 0, points: 0, diff: 0, form: [] };
      rows.set(section, r);
    }
    return r;
  };

  // Make sure every registered section shows up, even before it has played.
  for (const e of db.entries) {
    const s = sectionOf(e);
    if (s) row(s);
  }

  const finished = sortMatches(db.matches.filter((m) => m.status === "COMPLETED" && !m.bye && m.aId && m.bId && m.result));
  for (const m of finished) {
    const a = sectionOf(byId.get(m.aId!));
    const b = sectionOf(byId.get(m.bId!));
    if (!a || !b || a === b) continue;
    const ra = row(a);
    const rb = row(b);
    ra.played++;
    rb.played++;
    if (m.result === "DRAW") {
      ra.drawn++;
      rb.drawn++;
      ra.points += 1;
      rb.points += 1;
      ra.form.push("D");
      rb.form.push("D");
    } else {
      const [w, l] = m.result === "A" ? [ra, rb] : [rb, ra];
      w.won++;
      l.lost++;
      w.points += 3;
      w.form.push("W");
      l.form.push("L");
    }
  }

  const out = [...rows.values()];
  for (const r of out) {
    r.diff = r.won - r.lost;
    r.form = r.form.slice(-5);
  }
  return out.sort((x, y) => y.points - x.points || y.won - x.won || y.diff - x.diff || x.section.localeCompare(y.section));
}

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** Newest first: finished matches by start time. */
export function recentResults(matches: Match[], limit = 3): Match[] {
  return sortMatches(matches.filter((m) => m.status === "COMPLETED" && !m.bye))
    .reverse()
    .slice(0, limit);
}

export function resultText(m: Match, map: EntryMap): string {
  if (m.note.trim()) return m.note.trim();
  if (m.result === "DRAW") return "Match drawn";
  if (m.result === "A") return `${sideTitle(map, m.aId)} won`;
  if (m.result === "B") return `${sideTitle(map, m.bId)} won`;
  return "Full time";
}

export function scoreText(m: Match): string {
  return `${m.scoreA || "–"} - ${m.scoreB || "–"}`;
}

import type { DB, Entry, Match } from "./types";
import { SPORTS } from "./sports";
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
  /** Last five overall results, oldest first. */
  form: Array<"W" | "D" | "L">;
  /** Last five knockout/qualifier results, oldest first. */
  qualifierForm: Array<"W" | "D" | "L">;
}

/**
 * Overall championship table. VPL points come ONLY from official final placements:
 * team events: 15/10/5/5; individual events: 7/4/2/2.
 * Match records remain available for W-D-L/form statistics but never affect points.
 */
export function overallStandings(db: DB): SectionRow[] {
  const byId = entryMap(db);
  const rows = new Map<string, SectionRow>();
  const row = (section: string) => {
    let r = rows.get(section);
    if (!r) {
      r = { section, played: 0, won: 0, drawn: 0, lost: 0, points: 0, form: [], qualifierForm: [] };
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
      ra.form.push("D");
      rb.form.push("D");
      if (m.format === "KNOCKOUT") {
        ra.qualifierForm.push("D");
        rb.qualifierForm.push("D");
      }
    } else {
      const [w, l] = m.result === "A" ? [ra, rb] : [rb, ra];
      w.won++;
      l.lost++;
      w.form.push("W");
      l.form.push("L");
      if (m.format === "KNOCKOUT") {
        w.qualifierForm.push("W");
        l.qualifierForm.push("L");
      }
    }
  }

  // Award rulebook points once per sport from the saved final placements.
  // Match wins/draws/losses above are statistics only and never award points.
  for (const sport of SPORTS) {
    const award = db.awards?.[sport.id];
    if (!award) continue;
    const points = sport.kind === "TEAM" ? [15, 10, 5, 5] : [7, 4, 2, 2];
    const placements = [
      award.winnerEntryId,
      award.runnerUpEntryId,
      award.semifinalistAEntryId,
      award.semifinalistBEntryId,
    ];
    placements.forEach((entryId, i) => {
      if (!entryId) return;
      const entry = byId.get(entryId);
      if (!entry || entry.sportId !== sport.id) return;
      const section = sectionOf(entry);
      if (section) row(section).points += points[i];
    });
  }

  const out = [...rows.values()];
  for (const r of out) {
    r.form = r.form.slice(-5);
    r.qualifierForm = r.qualifierForm.slice(-5);
  }
  // No match-statistic tie-breakers: order by rulebook points, then section label.
  return out.sort((x, y) => y.points - x.points || x.section.localeCompare(y.section));
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

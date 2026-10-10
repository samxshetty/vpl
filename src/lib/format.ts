import { format, parseISO, isValid } from "date-fns";
import type { Entry, Match } from "./types";

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function entryLabel(e: Entry | undefined | null): string {
  if (!e) return "TBD";
  return e.kind === "team" ? (e.section || e.name) : e.name;
}

/** Short label for tight spaces (bracket cards). */
export function entryShort(e: Entry | undefined | null): string {
  if (!e) return "TBD";
  return e.kind === "team" ? e.section || e.name : e.name;
}

export function fmtDateTime(s: string | null) {
  if (!s) return "Not scheduled";
  const d = parseISO(s);
  return isValid(d) ? format(d, "EEE d MMM, h:mm a") : "Not scheduled";
}
export function fmtDay(s: string | null) {
  if (!s) return "Unscheduled";
  const d = parseISO(s);
  return isValid(d) ? format(d, "EEEE, d MMMM") : "Unscheduled";
}
export function fmtTime(s: string | null) {
  if (!s) return "--";
  const d = parseISO(s);
  return isValid(d) ? format(d, "h:mm a") : "--";
}
export function dayKey(s: string | null) {
  return s ? s.slice(0, 10) : "unscheduled";
}

export function sortMatches(ms: Match[]) {
  return [...ms].sort((a, b) => {
    if (a.startsAt && b.startsAt) return a.startsAt.localeCompare(b.startsAt) || a.round - b.round || a.slot - b.slot;
    if (a.startsAt) return -1;
    if (b.startsAt) return 1;
    return a.round - b.round || a.slot - b.slot;
  });
}

export function winnerId(m: Match): string | null {
  if (m.result === "A") return m.aId;
  if (m.result === "B") return m.bId;
  return null;
}

export function normaliseUsn(v: string) {
  return v.replace(/\s+/g, "").toUpperCase();
}

/** Big line + small line for an entry. Teams lead with their section (like the fan site), players with their name. */
export function entryParts(e: Entry | undefined | null): { title: string; sub: string } {
  if (!e) return { title: "TBD", sub: "" };
  if (e.kind === "team") return { title: e.section || e.name, sub: "" };
  return { title: e.name, sub: e.className };
}

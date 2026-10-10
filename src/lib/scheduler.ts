import { addDays, addMinutes, format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import type { FormatType, Match } from "./types";
import { uid } from "./format";

export interface ScheduleOpts {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // daily cut-off HH:mm — the last match must finish by then
  durationMin: number;
  gapMin: number;
  venues: string[];
}

const STAMP = "yyyy-MM-dd'T'HH:mm";

function at(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10) || 0);
  return setMinutes(setHours(startOfDay(day), h), m);
}

/**
 * Hands out time slots one at a time. Matches that share a slot are spread
 * across venues; when the day's window is full it rolls over to the next day.
 * `barrier()` forces the next match into a fresh slot, so a round never shares
 * a slot with the round before it.
 */
export function makeAllocator(o: ScheduleOpts) {
  const venues = o.venues.length ? o.venues : ["Main Ground"];
  const step = Math.max(1, o.durationMin + o.gapMin);
  let cur = at(parseISO(o.startDate), o.startTime);
  let vi = 0;

  const advanceSlot = () => {
    const next = addMinutes(cur, step);
    vi = 0;
    if (addMinutes(next, o.durationMin) > at(cur, o.endTime)) {
      cur = at(addDays(startOfDay(cur), 1), o.startTime);
    } else {
      cur = next;
    }
  };

  return {
    allocate() {
      if (vi >= venues.length) advanceSlot();
      const venue = venues[vi++];
      return { startsAt: format(cur, STAMP), venue };
    },
    barrier() {
      if (vi > 0) advanceSlot();
    },
  };
}

export function roundName(round: number, totalRounds: number) {
  if (round === totalRounds) return "Final";
  if (round === totalRounds - 1) return "Semi-final";
  if (round === totalRounds - 2) return "Quarter-final";
  return `Round ${round}`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function blank(sportId: string, format: FormatType): Omit<Match, "id" | "stage" | "round" | "slot" | "aId" | "bId"> {
  return {
    sportId,
    format,
    startsAt: null,
    venue: "",
    status: "UPCOMING",
    scoreA: "",
    scoreB: "",
    result: null,
    note: "",
  };
}

/** Circle method. Returns rounds of [a, b] pairs; odd counts get a rest slot per round. */
export function roundRobinRounds(ids: string[]): Array<Array<[string, string]>> {
  const list: Array<string | null> = [...ids];
  if (list.length % 2 === 1) list.push(null);
  const n = list.length;
  const rounds: Array<Array<[string, string]>> = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a && b) pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop() as string | null);
  }
  return rounds;
}

export function buildRoundRobin(sportId: string, ids: string[], o: ScheduleOpts, doubleLeg: boolean): Match[] {
  const alloc = makeAllocator(o);
  const legs = roundRobinRounds(ids);
  const all = doubleLeg ? [...legs, ...legs.map((r) => r.map(([a, b]) => [b, a] as [string, string]))] : legs;
  const out: Match[] = [];
  all.forEach((pairs, ri) => {
    alloc.barrier();
    pairs.forEach(([a, b], slot) => {
      const s = alloc.allocate();
      out.push({
        ...blank(sportId, "ROUND_ROBIN"),
        id: uid("m"),
        stage: `Round ${ri + 1}`,
        round: ri + 1,
        slot,
        aId: a,
        bId: b,
        startsAt: s.startsAt,
        venue: s.venue,
      });
    });
  });
  return out;
}

/** Classic seeding: 1 meets the lowest seed, and the top seeds stay apart until late rounds. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((x) => [x, n + 1 - x]);
  }
  return order;
}

export function buildKnockout(sportId: string, ids: string[], o: ScheduleOpts): Match[] {
  const n = ids.length;
  let size = 2;
  while (size < n) size *= 2;
  const totalRounds = Math.log2(size);
  const order = seedOrder(size);

  // Create every match first so rounds can point at each other.
  const rounds: Match[][] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const count = size / 2 ** r;
    rounds.push(
      Array.from({ length: count }, (_, i) => ({
        ...blank(sportId, "KNOCKOUT"),
        id: uid("m"),
        stage: roundName(r, totalRounds),
        round: r,
        slot: i,
        aId: null,
        bId: null,
      }))
    );
  }
  rounds.forEach((ms, ri) =>
    ms.forEach((m, i) => {
      if (ri < rounds.length - 1) {
        m.nextMatchId = rounds[ri + 1][Math.floor(i / 2)].id;
        m.nextSide = i % 2 === 0 ? "A" : "B";
      }
    })
  );

  // Round 1 from seeds; a missing opponent is a bye and the seed moves on.
  rounds[0].forEach((m, i) => {
    m.aId = ids[order[2 * i] - 1] ?? null;
    m.bId = ids[order[2 * i + 1] - 1] ?? null;
    if (m.aId && !m.bId) {
      m.bye = true;
      m.status = "COMPLETED";
      m.result = "A";
      m.note = "Bye";
      const next = rounds[1]?.[Math.floor(i / 2)];
      if (next) {
        if (m.nextSide === "A") next.aId = m.aId;
        else next.bId = m.aId;
      }
    }
  });

  const alloc = makeAllocator(o);
  rounds.forEach((ms) => {
    alloc.barrier();
    ms.forEach((m) => {
      if (m.bye) return;
      const s = alloc.allocate();
      m.startsAt = s.startsAt;
      m.venue = s.venue;
    });
  });
  return rounds.flat();
}

export function buildSingle(sportId: string, aId: string, bId: string, o: ScheduleOpts): Match {
  const s = makeAllocator(o).allocate();
  return {
    ...blank(sportId, "SINGLE"),
    id: uid("m"),
    stage: "Match",
    round: 1,
    slot: 0,
    aId,
    bId,
    startsAt: s.startsAt,
    venue: s.venue,
  };
}

export function buildFixtures(
  format: FormatType,
  sportId: string,
  ids: string[],
  o: ScheduleOpts,
  extra: { doubleLeg?: boolean; randomise?: boolean } = {}
): Match[] {
  const order = extra.randomise ? shuffle(ids) : ids;
  if (format === "ROUND_ROBIN") return buildRoundRobin(sportId, order, o, !!extra.doubleLeg);
  if (format === "KNOCKOUT") return buildKnockout(sportId, order, o);
  return order.length >= 2 ? [buildSingle(sportId, order[0], order[1], o)] : [];
}

"use client";

import { useSyncExternalStore } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { DB, Entry, FormatType, Match } from "./types";
import { buildSeed } from "./seed";
import { propagateWinner } from "./tournament";
import { getSupabase } from "./supabase/client";
import {
  entryFromRow,
  entryToRow,
  matchFromRow,
  matchToRow,
  type EntryRow,
  type FormatRow,
  type MatchRow,
} from "./db-map";

/**
 * Single live data store for the whole app, backed by Supabase.
 *
 *  - Public pages call useLiveDB()  -> read-only, updates in real time.
 *  - Admin pages call useStore()    -> same data plus write actions.
 *
 * Writes are applied locally first (so the UI feels instant), then sent to Supabase in order.
 * If a write fails, the error is shown and the store reloads from the server to get back in sync.
 * Row Level Security (supabase/schema.sql) is what actually restricts writes to admins.
 */

const EMPTY: DB = { entries: [], matches: [], formats: {} };

interface Snapshot {
  ready: boolean;
  db: DB;
  error: string | null;
}

// Identical on server and during hydration, so markup always matches.
const SERVER_SNAPSHOT: Snapshot = { ready: false, db: EMPTY, error: null };

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setSnapshot(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

/* ------------------------------ Loading ------------------------------ */

const NOT_CONFIGURED =
  "Supabase isn't configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart.";

async function loadAll() {
  const sb = getSupabase();
  if (!sb) {
    setSnapshot({ ready: true, error: NOT_CONFIGURED });
    return;
  }
  const [e, m, f] = await Promise.all([
    sb.from("entries").select("*").range(0, 4999),
    sb.from("matches").select("*").range(0, 4999),
    sb.from("sport_formats").select("*"),
  ]);
  const err = e.error ?? m.error ?? f.error;
  if (err) {
    setSnapshot({ ready: true, error: `Couldn't load data: ${err.message}` });
    return;
  }
  const formats: DB["formats"] = {};
  for (const r of (f.data ?? []) as FormatRow[]) formats[r.sport_id] = { format: r.format, updatedAt: r.updated_at };
  setSnapshot({
    ready: true,
    error: null,
    db: {
      entries: ((e.data ?? []) as EntryRow[]).map(entryFromRow),
      matches: ((m.data ?? []) as MatchRow[]).map(matchFromRow),
      formats,
    },
  });
}

/* ------------------------------ Realtime ------------------------------ */

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

type Change = RealtimePostgresChangesPayload<Record<string, unknown>>;

function applyChange(table: "entries" | "matches" | "sport_formats", p: Change) {
  const db = snapshot.db;
  const isDelete = p.eventType === "DELETE";

  if (table === "entries") {
    if (isDelete) {
      const id = (p.old as Partial<EntryRow>).id;
      setSnapshot({ db: { ...db, entries: db.entries.filter((x) => x.id !== id) } });
    } else {
      setSnapshot({ db: { ...db, entries: upsertById(db.entries, entryFromRow(p.new as unknown as EntryRow)) } });
    }
  } else if (table === "matches") {
    if (isDelete) {
      const id = (p.old as Partial<MatchRow>).id;
      setSnapshot({ db: { ...db, matches: db.matches.filter((x) => x.id !== id) } });
    } else {
      setSnapshot({ db: { ...db, matches: upsertById(db.matches, matchFromRow(p.new as unknown as MatchRow)) } });
    }
  } else {
    const formats = { ...db.formats };
    if (isDelete) {
      delete formats[(p.old as Partial<FormatRow>).sport_id as string];
    } else {
      const r = p.new as unknown as FormatRow;
      formats[r.sport_id] = { format: r.format, updatedAt: r.updated_at };
    }
    setSnapshot({ db: { ...db, formats } });
  }
}

let channel: RealtimeChannel | null = null;
let started = false;
let subscribedBefore = false;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function start() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (started) return;
  started = true;
  void loadAll();

  const sb = getSupabase();
  if (!sb) return;
  channel = sb
    .channel("vpl-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, (p) => applyChange("entries", p))
    .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, (p) => applyChange("matches", p))
    .on("postgres_changes", { event: "*", schema: "public", table: "sport_formats" }, (p) => applyChange("sport_formats", p))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // After a dropped connection, refetch so nothing missed in between is lost.
        if (subscribedBefore) void loadAll();
        subscribedBefore = true;
      }
    });
}

function stopSoon() {
  if (stopTimer) clearTimeout(stopTimer);
  // Small delay so React StrictMode / quick navigation doesn't tear the connection down and up again.
  stopTimer = setTimeout(() => {
    if (listeners.size > 0) return;
    const sb = getSupabase();
    if (sb && channel) void sb.removeChannel(channel);
    channel = null;
    started = false;
    subscribedBefore = false;
  }, 1500);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopSoon();
  };
}

/* ------------------------------ Writing ------------------------------ */

let queue: Promise<void> = Promise.resolve();

/** Run a Supabase write after the previous one finished. On failure: show the error and resync. */
function enqueue(label: string, op: () => PromiseLike<{ error: { message: string } | null }>) {
  queue = queue.then(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const { error } = await op();
      if (error) throw new Error(error.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const denied = /row-level security|permission|jwt/i.test(msg);
      const message = denied
        ? `${label} was rejected: you're not signed in as an admin.`
        : `${label} didn't save (${msg}). Showing the latest saved data.`;
      await loadAll(); // get back in sync with what's actually saved
      setSnapshot({ error: message }); // loadAll clears the error on success, so set ours after it
    }
  });
}

function update(fn: (db: DB) => DB) {
  setSnapshot({ db: fn(snapshot.db) });
}

const chunk = <T,>(rows: T[], size = 500): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
};

/* ------------------------------ Actions ------------------------------ */

const actions = {
  saveEntry(e: Entry) {
    update((d) => ({ ...d, entries: upsertById(d.entries, e) }));
    enqueue("Saving that entry", () => getSupabase()!.from("entries").upsert(entryToRow(e)));
  },

  deleteEntry(id: string) {
    update((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.id !== id),
      // Matches stay, but the removed side becomes "To be decided". (The database does the same via ON DELETE SET NULL.)
      matches: d.matches.map((m) => ({
        ...m,
        aId: m.aId === id ? null : m.aId,
        bId: m.bId === id ? null : m.bId,
      })),
    }));
    enqueue("Deleting that entry", () => getSupabase()!.from("entries").delete().eq("id", id));
  },

  saveMatch(m: Match) {
    const before = snapshot.db.matches;
    const withMatch = upsertById(before, m);
    const after = propagateWinner(withMatch, m);
    update((d) => ({ ...d, matches: after }));

    // Send the edited match, plus the next-round match if its slot was filled or cleared.
    const prev = new Map(before.map((x) => [x.id, x]));
    const changed = after.filter((x) => x.id === m.id || prev.get(x.id) !== x);
    enqueue("Saving that match", () => getSupabase()!.from("matches").upsert(changed.map(matchToRow)));
  },

  deleteMatch(id: string) {
    update((d) => ({ ...d, matches: d.matches.filter((m) => m.id !== id) }));
    enqueue("Deleting that match", () => getSupabase()!.from("matches").delete().eq("id", id));
  },

  generateFixtures(sportId: string, format: FormatType, matches: Match[], mode: "replace" | "append") {
    const had = snapshot.db.formats[sportId];
    const updatedAt = new Date().toISOString();
    const nextFormat = mode === "append" && had ? had : { format, updatedAt };

    update((d) => {
      const kept = mode === "replace" ? d.matches.filter((m) => m.sportId !== sportId) : d.matches;
      return { ...d, matches: [...kept, ...matches], formats: { ...d.formats, [sportId]: nextFormat } };
    });

    if (mode === "replace") {
      enqueue("Clearing the old fixtures", () => getSupabase()!.from("matches").delete().eq("sport_id", sportId));
    }
    for (const rows of chunk(matches.map(matchToRow))) {
      enqueue("Saving the fixtures", () => getSupabase()!.from("matches").upsert(rows));
    }
    enqueue("Saving the format", () =>
      getSupabase()!.from("sport_formats").upsert({ sport_id: sportId, format: nextFormat.format, updated_at: nextFormat.updatedAt })
    );
  },

  clearFixtures(sportId: string) {
    update((d) => {
      const formats = { ...d.formats };
      delete formats[sportId];
      return { ...d, matches: d.matches.filter((m) => m.sportId !== sportId), formats };
    });
    enqueue("Clearing the fixtures", () => getSupabase()!.from("matches").delete().eq("sport_id", sportId));
    enqueue("Clearing the format", () => getSupabase()!.from("sport_formats").delete().eq("sport_id", sportId));
  },

  /** Replaces EVERYTHING in the database with the built-in sample data. */
  loadSampleData() {
    const seed = buildSeed();
    update(() => seed);
    enqueue("Clearing matches", () => getSupabase()!.from("matches").delete().not("id", "is", null));
    enqueue("Clearing entries", () => getSupabase()!.from("entries").delete().not("id", "is", null));
    enqueue("Clearing formats", () => getSupabase()!.from("sport_formats").delete().not("sport_id", "is", null));
    for (const rows of chunk(seed.entries.map(entryToRow))) {
      enqueue("Saving sample entries", () => getSupabase()!.from("entries").upsert(rows));
    }
    for (const rows of chunk(seed.matches.map(matchToRow))) {
      enqueue("Saving sample matches", () => getSupabase()!.from("matches").upsert(rows));
    }
    enqueue("Saving sample formats", () =>
      getSupabase()!.from("sport_formats").upsert(
        Object.entries(seed.formats).map(([sport_id, f]) => ({ sport_id, format: f.format, updated_at: f.updatedAt }))
      )
    );
  },
};

/* ------------------------------ Hooks ------------------------------ */

function useSnapshot() {
  return useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
}

/** Admin: live data + write actions. */
export function useStore() {
  const snap = useSnapshot();
  return { ready: snap.ready, db: snap.db, error: snap.error, ...actions };
}

/** Public site: live data, read-only. */
export function useLiveDB() {
  const snap = useSnapshot();
  return { ready: snap.ready, db: snap.db, error: snap.error };
}

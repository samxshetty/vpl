"use client";

import { useState } from "react";
import { format as fmtDate } from "date-fns";
import { AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { FORMAT_LABEL, type FormatType, type Sport } from "@/lib/types";
import { buildFixtures, type ScheduleOpts } from "@/lib/scheduler";
import { entryLabel, fmtDateTime } from "@/lib/format";
import { Button, ConfirmDialog, EmptyState, Field, Select, inputClass } from "./ui";

const FORMATS: Array<{ id: FormatType; blurb: string }> = [
  { id: "ROUND_ROBIN", blurb: "Everyone plays everyone. Best for a league table." },
  { id: "KNOCKOUT", blurb: "Lose and you’re out. Builds a bracket, with byes if the number isn’t a power of two." },
  { id: "SINGLE", blurb: "One match between two sides." },
];

// Defaults use the current category IDs (not the legacy parent schedule IDs).
const DURATION: Record<string, number> = {
  "cricket-men": 120, "cricket-women": 90,
  "football-men": 60, "basketball-men": 30,
  "volleyball-men": 45, "throwball-women": 45,
  "tug-of-war-men": 20, "tug-of-war-women": 20,
  "relay-men": 20, "relay-women": 20,
  "badminton-men-singles": 30, "badminton-women-singles": 30, "badminton-mixed-doubles": 30,
  "chess-men": 45, "chess-women": 45, "carrom-men": 30, "carrom-women": 30,
  "dodgeball-women": 20,
};

// Default formats are explicit per category. Admins can still choose another format.
const DEFAULT_FORMAT: Record<string, FormatType> = {
  "chess-men": "ROUND_ROBIN", "chess-women": "ROUND_ROBIN",
  "cricket-men": "KNOCKOUT", "cricket-women": "KNOCKOUT",
  "football-men": "KNOCKOUT", "volleyball-men": "KNOCKOUT",
  "badminton-men-singles": "KNOCKOUT", "badminton-women-singles": "KNOCKOUT",
  "badminton-mixed-doubles": "KNOCKOUT", "carrom-men": "KNOCKOUT", "carrom-women": "KNOCKOUT",
  "basketball-men": "KNOCKOUT", "throwball-women": "KNOCKOUT",
  "tug-of-war-men": "KNOCKOUT", "tug-of-war-women": "KNOCKOUT",
  "relay-men": "KNOCKOUT", "relay-women": "KNOCKOUT", "dodgeball-women": "KNOCKOUT",
};

export function ScheduleTab({ sport, onGenerated }: { sport: Sport; onGenerated: () => void }) {
  const { db, generateFixtures, clearFixtures } = useStore();
  const entries = db.entries.filter((e) => e.sportId === sport.id);
  const existing = db.matches.filter((m) => m.sportId === sport.id);
  const noun = sport.kind === "TEAM" ? "teams" : "players";

  const [fmt, setFmt] = useState<FormatType>(db.formats[sport.id]?.format ?? DEFAULT_FORMAT[sport.id] ?? "KNOCKOUT");
  const [picked, setPicked] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const [singleA, setSingleA] = useState(entries[0]?.id ?? "");
  const [singleB, setSingleB] = useState(entries[1]?.id ?? "");
  const [startDate, setStartDate] = useState(() => fmtDate(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState(String(DURATION[sport.id] ?? 45));
  const [gap, setGap] = useState("15");
  const [venuesText, setVenuesText] = useState(sport.defaultVenue);
  const [doubleLeg, setDoubleLeg] = useState(false);
  const [randomise, setRandomise] = useState(false);
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const venues = venuesText.split(/[,\n]/).map((v) => v.trim()).filter(Boolean);
  const dur = parseInt(duration, 10);
  const gp = parseInt(gap, 10);

  const ids = fmt === "SINGLE" ? [singleA, singleB].filter(Boolean) : entries.filter((e) => picked.has(e.id)).map((e) => e.id);

  const errors: string[] = [];
  if (fmt === "SINGLE") {
    if (!singleA || !singleB) errors.push(`Choose two ${noun}.`);
    else if (singleA === singleB) errors.push(`Choose two different ${noun}.`);
  } else if (ids.length < 2) {
    errors.push(`Select at least two ${noun}.`);
  }
  if (!startDate) errors.push("Choose a start date.");
  if (!startTime || !endTime) errors.push("Set the daily start and end times.");
  if (!(dur >= 5)) errors.push("Match length must be at least 5 minutes.");
  if (!(gp >= 0)) errors.push("Break between matches can’t be negative.");
  if (fmt !== "SINGLE" && startTime && endTime && endTime <= startTime) errors.push("The daily end time must be after the start time.");
  if (fmt !== "SINGLE" && startTime && endTime && dur >= 5 && endTime > startTime) {
    const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    if (minutes(startTime) + dur > minutes(endTime)) errors.push("A match must fit between the daily start and finish times.");
  }
  if (venues.length === 0) errors.push("Add at least one venue.");
  if (existing.length > 0 && mode === "append" && existing.some((m) => m.format !== fmt)) errors.push("These fixtures use a different format. Replace them to change format, or select the existing format to append.");

  const opts: ScheduleOpts = { startDate, startTime, endTime, durationMin: dur, gapMin: gp, venues };

  // Cheap to compute, so recalculated on every change instead of memoised.
  let preview: { total: number; byes: number; first: string | null; last: string | null; days: number } | null = null;
  if (errors.length === 0) {
    const ms = buildFixtures(fmt, sport.id, ids, opts, { doubleLeg });
    const played = ms.filter((m) => !m.bye);
    const times = played.map((m) => m.startsAt).filter(Boolean) as string[];
    times.sort();
    preview = {
      total: played.length,
      byes: ms.length - played.length,
      first: times[0] ?? null,
      last: times[times.length - 1] ?? null,
      days: new Set(times.map((t) => t.slice(0, 10))).size,
    };
  }

  const run = () => {
    const ms = buildFixtures(fmt, sport.id, ids, opts, { doubleLeg, randomise });
    generateFixtures(sport.id, fmt, ms, existing.length > 0 ? mode : "replace");
    onGenerated();
  };

  const submit = () => {
    if (errors.length) return;
    if (existing.length > 0 && mode === "replace") setConfirmReplace(true);
    else run();
  };

  if (entries.length < 2) {
    return (
      <EmptyState
        title={`Add ${noun} first`}
        body={`You need at least two ${noun} before you can set up matches. Add them in the ${sport.kind === "TEAM" ? "Teams" : "Players"} tab.`}
      />
    );
  }

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-8 items-start">
      <div className="space-y-8">
        {/* Format */}
        <section className="glass-panel p-6 sm:p-8" aria-labelledby="fmt-h">
          <h2 id="fmt-h" className="text-2xl font-display font-bold mb-5">Format</h2>
          <div role="radiogroup" aria-labelledby="fmt-h" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                role="radio"
                aria-checked={fmt === f.id}
                onClick={() => setFmt(f.id)}
                className={clsx(
                  "text-left rounded-2xl border p-5 transition-colors focus-visible:outline-2 focus-visible:outline-[#f59e0b]",
                  fmt === f.id
                    ? "border-[#f59e0b]/60 bg-[#f59e0b]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                )}
              >
                <div className="text-xl font-display font-bold text-white">{FORMAT_LABEL[f.id]}</div>
                <p className="text-xs text-white/55 mt-2 leading-relaxed normal-case">{f.blurb}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Participants */}
        <section className="glass-panel p-6 sm:p-8" aria-labelledby="ppl-h">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 id="ppl-h" className="text-2xl font-display font-bold">
              {sport.kind === "TEAM" ? "Teams" : "Players"}
              {fmt !== "SINGLE" && (
                <span className="font-numbers text-lg tracking-wider text-white/40 ml-3">
                  {picked.size}/{entries.length}
                </span>
              )}
            </h2>
            {fmt !== "SINGLE" && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPicked(new Set(entries.map((e) => e.id)))}>
                  Select all
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {fmt === "SINGLE" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={sport.kind === "TEAM" ? "Team A" : "Player A"}>
                {(id) => (
                  <Select id={id} value={singleA} onChange={(e) => setSingleA(e.target.value)}>
                    {entries.map((e) => (
                      <option key={e.id} value={e.id}>{entryLabel(e)}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={sport.kind === "TEAM" ? "Team B" : "Player B"}>
                {(id) => (
                  <Select id={id} value={singleB} onChange={(e) => setSingleB(e.target.value)}>
                    {entries.map((e) => (
                      <option key={e.id} value={e.id}>{entryLabel(e)}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          ) : (
            <fieldset>
              <legend className="sr-only">Choose which {noun} take part</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entries.map((e) => (
                  <label
                    key={e.id}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-[#f59e0b]",
                      picked.has(e.id) ? "border-white/25 bg-white/[0.05]" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#990000]"
                      checked={picked.has(e.id)}
                      onChange={() => toggle(e.id)}
                    />
                    <span className="text-sm text-white/85 truncate">{entryLabel(e)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {fmt === "KNOCKOUT" && (
            <label className="flex items-center gap-3 mt-5 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#990000]" checked={randomise} onChange={(e) => setRandomise(e.target.checked)} />
              Shuffle the draw. Otherwise the list order sets the seeding, and the top seeds get byes.
            </label>
          )}
          {fmt === "ROUND_ROBIN" && (
            <label className="flex items-center gap-3 mt-5 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#990000]" checked={doubleLeg} onChange={(e) => setDoubleLeg(e.target.checked)} />
              Play each opponent twice (home and away)
            </label>
          )}
        </section>

        {/* Timing */}
        <section className="glass-panel p-6 sm:p-8" aria-labelledby="time-h">
          <h2 id="time-h" className="text-2xl font-display font-bold mb-5">
            {fmt === "SINGLE" ? "Date and venue" : "Timing and venues"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label={fmt === "SINGLE" ? "Date" : "First day"}>
              {(id) => <input id={id} type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />}
            </Field>
            <Field label={fmt === "SINGLE" ? "Start time" : "Daily start"}>
              {(id) => <input id={id} type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />}
            </Field>
            {fmt !== "SINGLE" && (
              <Field label="Daily finish" hint="Matches roll to the next day after this.">
                {(id) => <input id={id} type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />}
              </Field>
            )}
            {fmt !== "SINGLE" && (
              <>
                <Field label="Match length (minutes)">
                  {(id) => <input id={id} type="number" min={5} step={5} className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value)} />}
                </Field>
                <Field label="Break between (minutes)">
                  {(id) => <input id={id} type="number" min={0} step={5} className={inputClass} value={gap} onChange={(e) => setGap(e.target.value)} />}
                </Field>
              </>
            )}
            <Field
              label={fmt === "SINGLE" ? "Venue" : "Venues"}
              hint={fmt === "SINGLE" ? undefined : "Separate several venues with commas to run matches side by side."}
              className={fmt === "SINGLE" ? "sm:col-span-1" : "sm:col-span-3"}
            >
              {(id) => <input id={id} className={inputClass} value={venuesText} onChange={(e) => setVenuesText(e.target.value)} />}
            </Field>
          </div>
        </section>

        {existing.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 border-red-500/20" aria-labelledby="ex-h">
            <h2 id="ex-h" className="text-2xl font-display font-bold mb-2">Existing matches</h2>
            <p className="text-sm text-white/55 mb-5 normal-case">
              {existing.filter((m) => !m.bye).length} matches are already set up for {sport.name.toLowerCase()}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <Field label="When generating new matches">
                {(id) => (
                  <Select id={id} value={mode} onChange={(e) => setMode(e.target.value as "replace" | "append")}>
                    <option value="replace">Replace the existing matches</option>
                    <option value="append">Keep them and add the new ones</option>
                  </Select>
                )}
              </Field>
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                Delete all matches
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Summary */}
      <aside className="glass-panel p-6 sm:p-8 xl:sticky xl:top-28" aria-live="polite">
        <h2 className="text-2xl font-display font-bold mb-5">Summary</h2>
        {errors.length > 0 ? (
          <ul className="space-y-2 text-sm text-[#fbbf24]">
            {errors.map((e) => (
              <li key={e} className="flex gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {e}
              </li>
            ))}
          </ul>
        ) : preview ? (
          <dl className="space-y-4">
            <div>
              <dd className="font-numbers text-6xl tracking-wider text-[#f59e0b] leading-none">{preview.total}</dd>
              <dt className="text-xs font-semibold text-white/50 mt-1">
                {preview.total === 1 ? "match" : "matches"}
                {preview.byes > 0 && ` plus ${preview.byes} ${preview.byes === 1 ? "bye" : "byes"}`}
              </dt>
            </div>
            <div className="text-sm text-white/70 space-y-1 normal-case">
              <p>
                <span className="text-white/40">Format</span> {FORMAT_LABEL[fmt]}
              </p>
              <p>
                <span className="text-white/40">Starts</span> {fmtDateTime(preview.first)}
              </p>
              {preview.total > 1 && (
                <p>
                  <span className="text-white/40">Ends</span> {fmtDateTime(preview.last)}
                  <span className="text-white/40"> over {preview.days} {preview.days === 1 ? "day" : "days"}</span>
                </p>
              )}
            </div>
          </dl>
        ) : null}

        <Button variant="primary" className="w-full mt-7" onClick={submit} disabled={errors.length > 0}>
          {existing.length > 0 && mode === "replace" ? "Replace matches" : "Generate matches"}
        </Button>
        <p className="text-xs text-white/35 mt-3 normal-case">You can edit any match’s time, venue and result afterwards.</p>
      </aside>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace existing matches?"
        message={`This deletes the ${existing.filter((m) => !m.bye).length} matches already set up for ${sport.name.toLowerCase()}, including any scores, and creates the new ones.`}
        confirmLabel="Replace matches"
        onConfirm={run}
        onClose={() => setConfirmReplace(false)}
      />
      <ConfirmDialog
        open={confirmClear}
        title="Delete all matches?"
        message={`This removes every ${sport.name.toLowerCase()} match and clears the format. ${sport.kind === "TEAM" ? "Teams" : "Players"} are not affected.`}
        confirmLabel="Delete matches"
        onConfirm={() => clearFixtures(sport.id)}
        onClose={() => setConfirmClear(false)}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Match, MatchResult, MatchStatus, Sport } from "@/lib/types";
import { entryLabel } from "@/lib/format";
import { findConflicts } from "@/lib/tournament";
import { Button, Field, Modal, Select, inputClass } from "./ui";

export function MatchEditor({
  sport,
  match,
  isNew,
  onClose,
}: {
  sport: Sport;
  match: Match;
  isNew: boolean;
  onClose: () => void;
}) {
  const { db, saveMatch, deleteMatch } = useStore();
  const entries = db.entries.filter((e) => e.sportId === sport.id);
  const byId = new Map(entries.map((e) => [e.id, e]));

  const [stage, setStage] = useState(match.stage);
  const [aId, setAId] = useState(match.aId ?? "");
  const [bId, setBId] = useState(match.bId ?? "");
  const [date, setDate] = useState(match.startsAt?.slice(0, 10) ?? "");
  const [time, setTime] = useState(match.startsAt?.slice(11, 16) ?? "");
  const [venue, setVenue] = useState(match.venue);
  // A knockout fixture with an unassigned side is always editable as Upcoming.
  // This also recovers older/stale records that were saved with an invalid status.
  const [status, setStatus] = useState<MatchStatus>(
    match.format === "KNOCKOUT" && !match.bye && (!match.aId || !match.bId)
      ? "UPCOMING"
      : match.status
  );
  const [scoreA, setScoreA] = useState(match.scoreA);
  const [scoreB, setScoreB] = useState(match.scoreB);
  const [result, setResult] = useState<MatchResult>(match.result);
  const [note, setNote] = useState(match.note);
  const [isBye, setIsBye] = useState(!!match.bye);
  const [tried, setTried] = useState(false);

  const isKnockout = match.format === "KNOCKOUT";
  // Later knockout rounds are filled by the winners of earlier ones.
  const sidesLocked = isKnockout && match.round > 1 && !match.bye;
  const noun = sport.kind === "TEAM" ? "team" : "player";
  const hasBothSides = Boolean(aId && bId && aId !== bId);

  const changeSide = (side: "A" | "B", value: string) => {
    if (side === "A") setAId(value);
    else setBId(value);
    // Never leave an incomplete knockout fixture marked Live/Completed.
    if (isKnockout && !isBye && (!value || (side === "A" ? value === bId : value === aId))) {
      setStatus("UPCOMING");
      setResult(null);
      setScoreA("");
      setScoreB("");
    }
  };

  const venues = useMemo(
    () => Array.from(new Set([sport.defaultVenue, ...db.matches.map((m) => m.venue).filter(Boolean)])),
    [db.matches, sport.defaultVenue]
  );

  const startsAt = date ? `${date}T${time || "00:00"}` : null;

  const errors: Record<string, string> = {};
  if (!stage.trim()) errors.stage = "Give this match a name, for example “Round 1” or “Final”.";
  if (aId && aId === bId) errors.b = `Pick two different ${noun}s.`;
  if (date && !time) errors.time = "Add a start time.";
  if (!date && time) errors.date = "Add a date.";
  if (isBye && !aId) {
    errors.status = `Assign a ${noun} to side A before saving a bye.`;
  }
  if (!isBye && (status === "LIVE" || status === "COMPLETED") && (!aId || !bId)) {
    errors.status = `Both sides need a ${noun} before a match can be live or finished.`;
  }
  if (status === "COMPLETED" && !result && aId && bId) errors.result = "Choose who won.";

  const draft: Match = {
    ...match,
    stage: stage.trim(),
    aId: aId || null,
    bId: isBye ? null : (bId || null),
    bye: isKnockout ? isBye : match.bye,
    startsAt,
    venue: venue.trim(),
    status: isKnockout && isBye ? "COMPLETED" : status,
    scoreA: isBye ? "" : scoreA.trim(),
    scoreB: isBye ? "" : scoreB.trim(),
    result: isKnockout && isBye ? "A" : (status === "COMPLETED" ? result : null),
    note: isBye ? "Bye" : note.trim(),
  };
  const conflicts = findConflicts(draft, db.matches);

  const changeStatus = (next: MatchStatus) => {
    setStatus(next);
    // Convenience: if both scores are plain numbers, suggest the result.
    if (next === "COMPLETED" && !result) {
      const x = Number(scoreA);
      const y = Number(scoreB);
      if (scoreA.trim() && scoreB.trim() && !Number.isNaN(x) && !Number.isNaN(y)) {
        setResult(x > y ? "A" : x < y ? "B" : isKnockout ? null : "DRAW");
      }
    }
  };

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    saveMatch(draft);
    onClose();
  };

  const err = (k: string) => (tried ? errors[k] : undefined);
  const nameA = entryLabel(byId.get(aId));
  const nameB = entryLabel(byId.get(bId));

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add match" : "Edit match"}
      subtitle={`${sport.name} · ${match.format === "KNOCKOUT" ? "Knockout" : match.format === "ROUND_ROBIN" ? "Round robin" : "Single match"}`}
      wide
      footer={
        <>
          {!isNew && !isKnockout && (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                deleteMatch(match.id);
                onClose();
              }}
            >
              Delete match
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {isNew ? "Add match" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
        <Field label="Match name" error={err("stage")} className="sm:col-span-2">
          {(id) => <input id={id} className={inputClass} value={stage} onChange={(e) => setStage(e.target.value)} />}
        </Field>

        {isKnockout && (
          <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 accent-[#f59e0b]"
              checked={isBye}
              disabled={match.round > 1 && !match.bye}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsBye(checked);
                if (checked) {
                  setBId("");
                  setStatus("COMPLETED");
                  setResult("A");
                  setScoreA("");
                  setScoreB("");
                  setNote("Bye");
                } else {
                  setStatus("UPCOMING");
                  setResult(null);
                  setNote("");
                }
              }}
            />
            <span>
              <span className="block text-sm font-semibold text-white">This match is a bye</span>
              <span className="block text-xs text-white/45 mt-1">A bye advances Team/Player A automatically. Uncheck it to restore a normal match.</span>
            </span>
          </label>
        )}

        <Field
          label={sport.kind === "TEAM" ? "Team A" : "Player A"}
          hint={sidesLocked ? "Filled in automatically from the previous round." : undefined}
        >
          {(id) => (
            <Select id={id} value={aId} disabled={sidesLocked} onChange={(e) => changeSide("A", e.target.value)}>
              <option value="">To be decided</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {entryLabel(e)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={sport.kind === "TEAM" ? "Team B" : "Player B"} error={err("b")}>
          {(id) => (
            <Select id={id} value={bId} disabled={sidesLocked || isBye} onChange={(e) => changeSide("B", e.target.value)}>
              <option value="">To be decided</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {entryLabel(e)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Date" error={err("date")}>
          {(id) => <input id={id} type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Field label="Start time" error={err("time")}>
          {(id) => <input id={id} type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />}
        </Field>

        <Field label="Venue" className="sm:col-span-2">
          {(id) => (
            <>
              <input id={id} list="venue-options" className={inputClass} value={venue} onChange={(e) => setVenue(e.target.value)} />
              <datalist id="venue-options">
                {venues.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        {conflicts.length > 0 && (
          <div className="sm:col-span-2 flex gap-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fbbf24]" role="status">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              {conflicts.map((c) => (
                <p key={c}>{c}</p>
              ))}
              <p className="text-white/50 text-xs mt-1">You can still save. This is only a warning.</p>
            </div>
          </div>
        )}

        <div className="sm:col-span-2 border-t border-white/[0.06] pt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
          <Field label="Status" error={err("status")} className="sm:col-span-2">
            {(id) => (
              <Select id={id} value={status} onChange={(e) => changeStatus(e.target.value as MatchStatus)}>
                <option value="UPCOMING">Upcoming</option>
                <option value="LIVE" disabled={isKnockout && !isBye && !hasBothSides}>Live</option>
                <option value="COMPLETED" disabled={isKnockout && !isBye && !hasBothSides}>Completed</option>
              </Select>
            )}
          </Field>

          {status !== "UPCOMING" && !isBye && (
            <>
              <Field label={`Score: ${aId ? nameA : "A"}`} hint="Any format works, for example 112/4 or 21-18, 21-14.">
                {(id) => <input id={id} className={inputClass} value={scoreA} onChange={(e) => setScoreA(e.target.value)} />}
              </Field>
              <Field label={`Score: ${bId ? nameB : "B"}`}>
                {(id) => <input id={id} className={inputClass} value={scoreB} onChange={(e) => setScoreB(e.target.value)} />}
              </Field>
            </>
          )}

          {status === "COMPLETED" && !isBye && (
            <>
              <Field label="Result" error={err("result")}>
                {(id) => (
                  <Select id={id} value={result ?? ""} onChange={(e) => setResult((e.target.value || null) as MatchResult)}>
                    <option value="">Choose a result</option>
                    <option value="A">{aId ? `${nameA} won` : "A won"}</option>
                    <option value="B">{bId ? `${nameB} won` : "B won"}</option>
                    {!isKnockout && <option value="DRAW">Draw</option>}
                  </Select>
                )}
              </Field>
              <Field label="Result summary" hint="Optional, for example “Won by 4 wickets”.">
                {(id) => <input id={id} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />}
              </Field>
            </>
          )}
          {status === "LIVE" && !isBye && (
            <Field label="Live update" hint="Optional, for example “Innings 2, 13.1 ov”." className="sm:col-span-2">
              {(id) => <input id={id} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          )}
        </div>
      </div>
    </Modal>
  );
}

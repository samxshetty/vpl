"use client";

import { useRef, useState } from "react";
import { ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Entry, Player, SoloEntry, Sport, TeamEntry } from "@/lib/types";
import { normaliseUsn, uid } from "@/lib/format";
import { Button, Field, Modal, inputClass } from "./ui";

/** Parse pasted rows such as "Aarav Kumar, 1VP23CS001" (comma, tab, or trailing USN). */
function parseRoster(text: string): Player[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) return { id: uid("p"), name: parts[0], usn: normaliseUsn(parts[1]) };
      const tokens = line.split(/\s+/);
      const usn = tokens.length > 1 ? tokens.pop()! : "";
      return { id: uid("p"), name: tokens.join(" "), usn: normaliseUsn(usn) };
    });
}

export function EntryEditor({
  sport,
  entry,
  isNew,
  onClose,
}: {
  sport: Sport;
  entry: Entry;
  isNew: boolean;
  onClose: () => void;
}) {
  return entry.kind === "team" ? (
    <TeamForm sport={sport} entry={entry} isNew={isNew} onClose={onClose} />
  ) : (
    <SoloForm sport={sport} entry={entry} isNew={isNew} onClose={onClose} />
  );
}

/* ------------------------------ Team ------------------------------ */

function TeamForm({ sport, entry, isNew, onClose }: { sport: Sport; entry: TeamEntry; isNew: boolean; onClose: () => void }) {
  const { db, saveEntry } = useStore();
  const [section, setSection] = useState(entry.section);

const sections = [
  "2A",
  "2B",
  "2C",
  "2D",
  "2E",
  "3A",
  "3B",
  "3C",
  "3D",
  "3E",
  "4A",
  "4B",
  "4C",
];
  const [players, setPlayers] = useState<Player[]>(entry.players.length ? entry.players : [{ id: uid("p"), name: "", usn: "" }]);
  const [paste, setPaste] = useState(false);
  const [pasted, setPasted] = useState("");
  const [tried, setTried] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);

  const others = db.entries.filter((e): e is TeamEntry => e.sportId === sport.id && e.kind === "team" && e.id !== entry.id);

  const filled = players.filter((p) => p.name.trim() || p.usn.trim());
  const errors: Record<string, string> = {};
  if (sport.rosterSize && filled.length !== sport.rosterSize) errors.roster = `Enter exactly ${sport.rosterSize} players (including substitutes) before saving.`;
  if (!section.trim()) errors.section = "Choose a section from the dropdown.";
  else if (others.some((t) => t.section.trim().toLowerCase() === section.trim().toLowerCase())) {
    errors.section = `Section ${section.trim().toUpperCase()} already has a ${sport.name.toLowerCase()} team.`;
  }

  // Row-level checks: both fields filled, and no USN used twice in this sport.
  const usnOwner = new Map<string, string>();
  others.forEach((t) => t.players.forEach((p) => usnOwner.set(normaliseUsn(p.usn), t.name)));
  const seen = new Map<string, number>();
  filled.forEach((p) => seen.set(normaliseUsn(p.usn), (seen.get(normaliseUsn(p.usn)) ?? 0) + 1));
  const rowError = (p: Player): string | undefined => {
    if (!p.name.trim() && !p.usn.trim()) return undefined;
    if (!p.name.trim()) return "Add the player’s name.";
    if (!p.usn.trim()) return "Add the USN.";
    const u = normaliseUsn(p.usn);
    if ((seen.get(u) ?? 0) > 1) return "This USN appears twice in the roster.";
    if (usnOwner.has(u)) return `Already on ${usnOwner.get(u)}.`;
    return undefined;
  };
  const rowErrors = players.map(rowError);
  const hasRowError = rowErrors.some(Boolean);

  const update = (id: string, patch: Partial<Player>) => setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addRow = () => {
    if (sport.rosterSize && players.length >= sport.rosterSize) return;
    setPlayers((ps) => [...ps, { id: uid("p"), name: "", usn: "" }]);
    setTimeout(() => {
      listEnd.current?.scrollIntoView({ block: "nearest" });
      const inputs = listEnd.current?.parentElement?.querySelectorAll<HTMLInputElement>("input[data-player-name]");
      inputs?.[inputs.length - 1]?.focus();
    }, 30);
  };
  const addPasted = () => {
    const rows = parseRoster(pasted);
    if (!rows.length) return;
    setPlayers((ps) => [...ps.filter((p) => p.name.trim() || p.usn.trim()), ...rows]);
    setPasted("");
    setPaste(false);
  };

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length || hasRowError) return;
    saveEntry({
      ...entry,
      name: section.trim().toUpperCase(),
      section: section.trim().toUpperCase(),
      players: filled.map((p) => ({ ...p, name: p.name.trim(), usn: normaliseUsn(p.usn) })),
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? "Add team" : "Edit team"}
      subtitle={sport.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {isNew ? "Add team" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="mb-8 max-w-sm">
        <Field label="Section / team name" error={tried ? errors.section : undefined}>
          {(id) => (
            <select id={id} className={inputClass} value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Choose section</option>
              {sections.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )}
        </Field>
        <p className="text-xs text-white/40 mt-2">The section name is used as the team name in fixtures, brackets and results.</p>
      </div>

      {tried && errors.roster && <p className="text-sm text-red-300 mb-3" role="alert">{errors.roster}</p>}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-display font-bold text-white/90">
          Players <span className="font-numbers text-lg tracking-wider text-white/40 ml-1">{filled.length}</span>
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setPaste((v) => !v)} aria-expanded={paste}>
          <ClipboardPaste className="w-3.5 h-3.5" /> Paste a list
        </Button>
      </div>

      {paste && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label htmlFor="roster-paste" className="block text-xs font-semibold text-white/60 mb-1.5">
            One player per line: name, then USN
          </label>
          <textarea
            id="roster-paste"
            rows={5}
            className={inputClass + " font-mono text-xs"}
            placeholder={"Aarav Kumar, 1VP23CS001\nRohan Shetty, 1VP23EC014"}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="ghost" onClick={() => setPaste(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={addPasted} disabled={!pasted.trim()}>
              Add to roster
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="hidden sm:grid grid-cols-[2rem_1fr_12rem_2.5rem] gap-3 text-xs font-semibold text-white/40 px-1">
          <span />
          <span>Player name</span>
          <span>USN</span>
          <span />
        </div>
        {players.map((p, i) => {
          const e = rowErrors[i];
          return (
            <div key={p.id}>
              <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2rem_1fr_12rem_2.5rem] gap-3 items-center">
                <span className="hidden sm:block font-numbers text-lg text-white/30 text-center">{i + 1}</span>
                <input
                  data-player-name
                  aria-label={`Player ${i + 1} name`}
                  placeholder="Name"
                  className={inputClass}
                  value={p.name}
                  onChange={(ev) => update(p.id, { name: ev.target.value })}
                />
                <input
                  aria-label={`Player ${i + 1} USN`}
                  placeholder="USN"
                  className={inputClass + " uppercase font-mono"}
                  value={p.usn}
                  onChange={(ev) => update(p.id, { usn: ev.target.value })}
                />
                <button
                  onClick={() => setPlayers((ps) => ps.filter((x) => x.id !== p.id))}
                  aria-label={`Remove player ${i + 1}`}
                  className="p-2 rounded-lg text-white/35 hover:text-red-300 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-[#f59e0b] justify-self-end"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {tried && e && <p className="text-xs text-red-300 mt-1 sm:ml-11" role="alert">{e}</p>}
            </div>
          );
        })}
        <div ref={listEnd} />
      </div>

      <Button size="sm" className="mt-4" onClick={addRow} disabled={Boolean(sport.rosterSize && players.length >= sport.rosterSize)}>
        <Plus className="w-3.5 h-3.5" /> Add player{sport.rosterSize ? ` (${players.length}/${sport.rosterSize})` : ""}
      </Button>
    </Modal>
  );
}

/* ---------------------------- Individual ---------------------------- */

function SoloForm({ sport, entry, isNew, onClose }: { sport: Sport; entry: SoloEntry; isNew: boolean; onClose: () => void }) {
  const { db, saveEntry } = useStore();
  const [name, setName] = useState(entry.name);
  const [usn, setUsn] = useState(entry.usn);
  const [className, setClassName] = useState(entry.className);
  const sections = ["3A", "3B", "3C", "3D", "3E", "5A", "5B", "5C", "5D", "7A", "7B", "7C", "7D"];
  const [tried, setTried] = useState(false);

  const others = db.entries.filter((e) => e.sportId === sport.id && e.id !== entry.id);
  const errors: Record<string, string> = {};
  if (!name.trim()) errors.name = "Enter the player’s name.";
  if (!usn.trim()) errors.usn = "Enter the USN.";
  else if (others.some((e) => e.kind === "solo" && normaliseUsn(e.usn) === normaliseUsn(usn))) {
    errors.usn = `This USN is already registered for ${sport.name.toLowerCase()}.`;
  }
  if (!className.trim()) errors.className = "Choose a class/section.";

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    saveEntry({ ...entry, name: name.trim(), usn: normaliseUsn(usn), className: className.trim().toUpperCase() });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? "Add player" : "Edit player"}
      subtitle={sport.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {isNew ? "Add player" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Name" error={tried ? errors.name : undefined}>
          {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-5">
          <Field label="USN" error={tried ? errors.usn : undefined}>
            {(id) => <input id={id} className={inputClass + " uppercase font-mono"} value={usn} onChange={(e) => setUsn(e.target.value)} />}
          </Field>
          <Field label="Class" error={tried ? errors.className : undefined}>
            {(id) => (
            <select id={id} className={inputClass} value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">Choose section</option>
              {sections.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )}
          </Field>
        </div>
      </div>
    </Modal>
  );
}

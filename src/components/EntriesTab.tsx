"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Entry, Sport } from "@/lib/types";
import { uid } from "@/lib/format";
import { Button, ConfirmDialog, EmptyState, inputClass } from "./ui";
import { EntryEditor } from "./EntryEditor";

export function EntriesTab({ sport }: { sport: Sport }) {
  const { db, deleteEntry } = useStore();
  const isTeam = sport.kind === "TEAM";
  const entries = db.entries.filter((e) => e.sportId === sport.id);

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ entry: Entry; isNew: boolean } | null>(null);
  const [removing, setRemoving] = useState<Entry | null>(null);

  const blank = (): Entry =>
    isTeam
      ? { kind: "team", id: uid("e"), sportId: sport.id, name: "", section: "", players: [] }
      : { kind: "solo", id: uid("e"), sportId: sport.id, name: "", usn: "", className: "" };

  const needle = q.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (!needle) return true;
    if (e.kind === "team") {
      return [e.name, e.section, ...e.players.flatMap((p) => [p.name, p.usn])].some((s) => s.toLowerCase().includes(needle));
    }
    return [e.name, e.usn, e.className].some((s) => s.toLowerCase().includes(needle));
  });

  const matchCount = (id: string) => db.matches.filter((m) => m.aId === id || m.bId === id).length;
  const removeMessage = (e: Entry) => {
    const n = matchCount(e.id);
    const label = e.kind === "team" ? `${e.name} (${e.section})` : e.name;
    return n > 0
      ? `${label} is in ${n} ${n === 1 ? "match" : "matches"}. Those matches will stay but this side becomes “To be decided”.`
      : `${label} will be removed from ${sport.name.toLowerCase()}.`;
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/35 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
          <input
            type="search"
            aria-label={isTeam ? "Search teams or players" : "Search players"}
            placeholder={isTeam ? "Search teams, players or USN" : "Search name, USN or class"}
            className={inputClass + " pl-11"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setEditing({ entry: blank(), isNew: true })}>
          <Plus className="w-4 h-4" /> {isTeam ? "Add team" : "Add player"}
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title={isTeam ? "No teams yet" : "No players yet"}
          body={isTeam ? "Add a team with its section and players to get started." : "Add a player with their USN and class to get started."}
          action={
            <Button variant="primary" onClick={() => setEditing({ entry: blank(), isNew: true })}>
              <Plus className="w-4 h-4" /> {isTeam ? "Add team" : "Add player"}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No results" body={`Nothing matches “${q}”. Check the spelling or clear the search.`} />
      ) : isTeam ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((e) =>
            e.kind === "team" ? (
              <article key={e.id} className="glass-panel p-0 overflow-hidden hover:border-white/20 transition-colors flex flex-col">
                <div className="px-6 sm:px-8 py-6 flex items-start justify-between gap-4 border-b border-white/[0.05] bg-white/[0.02]">
                  <div className="min-w-0">
                    <div className="text-5xl font-display font-bold tracking-tighter text-white leading-none">{e.section}</div>
                    <div className="text-sm text-white/55 mt-2 truncate normal-case">{e.name}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => setEditing({ entry: e, isNew: false })} aria-label={`Edit ${e.name}`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setRemoving(e)} aria-label={`Delete ${e.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="px-6 sm:px-8 py-5 flex-1">
                  <div className="text-xs font-semibold text-white/40 mb-3">
                    {e.players.length} {e.players.length === 1 ? "player" : "players"}
                  </div>
                  {e.players.length === 0 ? (
                    <p className="text-sm text-white/40">No players added yet.</p>
                  ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {e.players.map((p) => (
                        <li key={p.id} className="flex justify-between gap-3">
                          <span className="text-white/80 truncate">{p.name}</span>
                          <span className="font-mono text-xs text-white/35 shrink-0 self-center">{p.usn}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ) : null
          )}
        </div>
      ) : (
        <div className="glass-panel p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Registered players</caption>
              <thead className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
                <tr>
                  <th scope="col" className="pb-4 font-semibold">Name</th>
                  <th scope="col" className="pb-4 font-semibold">USN</th>
                  <th scope="col" className="pb-4 font-semibold">Class</th>
                  <th scope="col" className="pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-sm">
                {filtered.map((e) =>
                  e.kind === "solo" ? (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 text-lg font-display font-bold tracking-tight text-white/90">{e.name}</td>
                      <td className="py-4 font-mono text-xs text-white/55">{e.usn}</td>
                      <td className="py-4 text-white/70">{e.className}</td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setEditing({ entry: e, isNew: false })} aria-label={`Edit ${e.name}`}>
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setRemoving(e)} aria-label={`Delete ${e.name}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <EntryEditor sport={sport} entry={editing.entry} isNew={editing.isNew} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!removing}
        title={isTeam ? "Delete this team?" : "Delete this player?"}
        message={removing ? removeMessage(removing) : ""}
        confirmLabel={isTeam ? "Delete team" : "Delete player"}
        onConfirm={() => removing && deleteEntry(removing.id)}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}

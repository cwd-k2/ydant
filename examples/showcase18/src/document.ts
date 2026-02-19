/**
 * Showcase 18 — Shared document model
 *
 * 2 つのエディタが共有するドキュメント。
 * 各行は signal で管理され、lastEditor で最終編集者を追跡。
 */

import { signal } from "@ydant/reactive";

export interface Line {
  content: string;
  lastEditor: "A" | "B" | null;
}

const INITIAL_LINES: Line[] = [
  { content: "# Collaborative Document", lastEditor: null },
  { content: "", lastEditor: null },
  { content: "This is a shared document.", lastEditor: null },
  { content: "Both editors can modify lines.", lastEditor: null },
  { content: "Conflicts are detected and resolved.", lastEditor: null },
  { content: "", lastEditor: null },
  { content: "Try editing the same line!", lastEditor: null },
];

export const lines = signal<Line[]>(INITIAL_LINES);

export function editLine(index: number, content: string, editor: "A" | "B"): boolean {
  const current = lines();
  if (index < 0 || index >= current.length) return false;

  const line = current[index];
  const isConflict = line.lastEditor !== null && line.lastEditor !== editor;

  const updated = [...current];
  updated[index] = { content, lastEditor: editor };
  lines.set(updated);

  return isConflict;
}

export function resetEditors() {
  lines.set(lines().map((l) => ({ ...l, lastEditor: null })));
}

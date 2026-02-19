/**
 * Showcase 18 — Conflict detection/resolution + auto-play
 *
 * 2 つのエディタ間の競合を検出し、pause → 解決 → resume のフローを管理。
 * auto-play モードでランダムに編集を生成する。
 */

import type { Engine, Hub } from "@ydant/core";
import { signal } from "@ydant/reactive";
import { batch } from "@ydant/reactive";
import { lines, editLine } from "./document";

export interface ConflictInfo {
  lineIndex: number;
  editorA: string;
  editorB: string;
}

export const conflictState = signal<ConflictInfo | null>(null);
export const conflictCount = signal(0);
export const editCount = signal(0);
export const errorLog = signal<string[]>([]);

// Engine references (set from index.ts)
let _engineA: Engine | undefined;
let _engineB: Engine | undefined;
let _hub: Hub | undefined;

export function setEngines(engineA: Engine, engineB: Engine, hub: Hub) {
  _engineA = engineA;
  _engineB = engineB;
  _hub = hub;
}

function appendError(msg: string) {
  errorLog.update((prev) => {
    const next = [...prev, msg];
    return next.length > 30 ? next.slice(-30) : next;
  });
}

export const eventLog = signal<string[]>([]);

function appendEvent(msg: string) {
  eventLog.update((prev) => {
    const next = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
    return next.length > 30 ? next.slice(-30) : next;
  });
}

function resolveConflict(lineIndex: number) {
  const current = lines();
  const line = current[lineIndex];
  if (!line) return;

  batch(() => {
    // Merge: keep the content, reset lastEditor
    const updated = [...current];
    updated[lineIndex] = { ...line, lastEditor: null };
    lines.set(updated);
    conflictState.set(null);
  });

  // Resume paused engine
  if (_engineB?.paused) _engineB.resume();
  if (_engineA?.paused) _engineA.resume();

  appendEvent(`Conflict resolved on line ${lineIndex + 1}`);
}

export function simulateEdit(editor: "A" | "B") {
  const current = lines();
  const lineIndex = Math.floor(Math.random() * current.length);
  const words = ["hello", "world", "foo", "bar", "edit", "change", "update", "fix"];
  const word = words[Math.floor(Math.random() * words.length)];
  const newContent = current[lineIndex].content ? current[lineIndex].content + " " + word : word;

  editCount.update((n) => n + 1);

  const isConflict = editLine(lineIndex, newContent, editor);

  appendEvent(`${editor} edited line ${lineIndex + 1}: "${word}"`);

  // Notify the other editor via dispatch
  if (_hub) {
    const targetEngine = editor === "A" ? _engineB : _engineA;
    if (targetEngine) {
      _hub.dispatch(targetEngine, {
        type: "edit:remote",
        editor,
        lineIndex,
        content: newContent,
      });
    }
  }

  if (isConflict && !conflictState()) {
    conflictCount.update((n) => n + 1);
    conflictState.set({
      lineIndex,
      editorA: editor === "A" ? newContent : current[lineIndex].content,
      editorB: editor === "B" ? newContent : current[lineIndex].content,
    });

    appendEvent(`CONFLICT on line ${lineIndex + 1}!`);

    // Pause the other editor's engine
    const otherEngine = editor === "A" ? _engineB : _engineA;
    if (otherEngine && !otherEngine.paused) {
      otherEngine.pause();
      appendEvent(`Engine ${editor === "A" ? "B" : "A"} paused`);
    }

    // Auto-resolve after delay
    setTimeout(() => resolveConflict(lineIndex), 1500);
  }
}

// Auto-play
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;
export const autoPlaying = signal(false);

export function toggleAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    autoPlaying.set(false);
  } else {
    autoPlaying.set(true);
    autoPlayTimer = setInterval(() => {
      if (!conflictState()) {
        const editor = Math.random() > 0.5 ? "A" : "B";
        simulateEdit(editor as "A" | "B");
      }
    }, 800);
  }
}

// Register onError handlers
export function registerErrorHandlers() {
  _engineA?.onError((err) => {
    appendError(`Engine A error: ${err}`);
    appendEvent(`Engine A ERROR: ${err}`);
  });
  _engineB?.onError((err) => {
    appendError(`Engine B error: ${err}`);
    appendEvent(`Engine B ERROR: ${err}`);
  });
}

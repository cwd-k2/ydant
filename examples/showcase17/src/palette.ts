/**
 * Showcase 17 — Color palette data + signals
 */

import { signal, computed } from "@ydant/reactive";

export interface ColorInfo {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function makeColor(name: string, hex: string): ColorInfo {
  return { name, hex, ...hexToRgb(hex) };
}

export const ALL_COLORS: ColorInfo[] = [
  makeColor("Coral", "#ef4444"),
  makeColor("Amber", "#f59e0b"),
  makeColor("Lime", "#84cc16"),
  makeColor("Emerald", "#10b981"),
  makeColor("Cyan", "#06b6d4"),
  makeColor("Blue", "#3b82f6"),
  makeColor("Violet", "#8b5cf6"),
  makeColor("Pink", "#ec4899"),
  makeColor("Rose", "#f43f5e"),
  makeColor("Teal", "#14b8a6"),
  makeColor("Indigo", "#6366f1"),
  makeColor("Sky", "#0ea5e9"),
];

export const filter = signal("");
export const selectedIndex = signal(0);
export const highlightIndex = signal<number | null>(null);

export const filteredColors = computed(() => {
  const q = filter().toLowerCase();
  if (!q) return ALL_COLORS;
  return ALL_COLORS.filter((c) => c.name.toLowerCase().includes(q) || c.hex.includes(q));
});

export const selectedColor = computed(() => {
  const colors = filteredColors();
  const idx = selectedIndex();
  return colors[Math.min(idx, colors.length - 1)] ?? colors[0];
});

// Message log (appended from both DOM and Canvas sides)
export interface LogEntry {
  direction: "dom" | "canvas";
  type: string;
  payload: string;
}

export const messageLog = signal<LogEntry[]>([]);

export function appendLog(entry: LogEntry) {
  messageLog.update((prev) => {
    const next = [...prev, entry];
    return next.length > 50 ? next.slice(-50) : next;
  });
}

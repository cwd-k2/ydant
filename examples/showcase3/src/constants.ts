import type { TimerMode } from "./types";

export const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60, // 25 minutes
  break: 5 * 60, // 5 minutes
  "long-break": 15 * 60, // 15 minutes
};

export const MODE_LABELS: Record<TimerMode, string> = {
  work: "Work",
  break: "Short Break",
  "long-break": "Long Break",
};

export const MODE_COLORS: Record<TimerMode, { bg: string; text: string; ring: string }> = {
  work: {
    bg: "bg-red-500",
    text: "text-red-400",
    ring: "#dc2626",
  },
  break: {
    bg: "bg-green-500",
    text: "text-green-400",
    ring: "#059669",
  },
  "long-break": {
    bg: "bg-blue-500",
    text: "text-blue-400",
    ring: "#2563eb",
  },
};

/**
 * Showcase 15 — Shared signals
 *
 * DOM / Canvas / SSR の 3 つのスコープが共有するデータモデル。
 * signal 変更は各 Engine の Scheduler タイミングで反映される。
 */

import { signal, computed } from "@ydant/reactive";

// Data points for the bar chart
export interface DataPoint {
  label: string;
  value: number;
  color: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function randomValue() {
  return 10 + Math.floor(Math.random() * 90);
}

export const dataPoints = signal<DataPoint[]>([
  { label: "A", value: 65, color: COLORS[0] },
  { label: "B", value: 42, color: COLORS[1] },
  { label: "C", value: 78, color: COLORS[2] },
  { label: "D", value: 31, color: COLORS[3] },
  { label: "E", value: 56, color: COLORS[4] },
]);

export const chartTitle = signal("Dashboard");
export const showGrid = signal(true);

// SSR preview HTML (written by SSR engine's onFlush, read by DOM engine)
export const htmlPreview = signal("");

// Stats
export const domFlushCount = signal(0);
export const canvasFlushCount = signal(0);
export const ssrFlushCount = signal(0);

export const totalBars = computed(() => dataPoints().length);

// Mutations
export function randomizeData() {
  dataPoints.set(dataPoints().map((dp) => ({ ...dp, value: randomValue() })));
}

export function addBar() {
  const points = dataPoints();
  if (points.length >= 8) return;
  const idx = points.length;
  dataPoints.set([
    ...points,
    {
      label: String.fromCharCode(65 + idx),
      value: randomValue(),
      color: COLORS[idx % COLORS.length],
    },
  ]);
}

export function removeBar() {
  const points = dataPoints();
  if (points.length <= 2) return;
  dataPoints.set(points.slice(0, -1));
}

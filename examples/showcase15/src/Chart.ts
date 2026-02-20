/**
 * Showcase 15 — Canvas bar chart scene
 *
 * Canvas scope 下で動作する棒グラフ。
 * reactive() で signal を購読し、VShape ツリーを自動更新する。
 */

import { group, rect, canvasText } from "@ydant/canvas";
import { reactive } from "@ydant/reactive";
import { dataPoints, chartTitle, showGrid } from "./signals";

const W = 360;
const H = 240;
const PAD_TOP = 30;
const PAD_BOTTOM = 24;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;

export const Chart = () =>
  group(function* () {
    // Reactive chart — redraws when signals change
    yield* reactive(() => {
      const points = dataPoints();
      const title = chartTitle();
      const grid = showGrid();
      const barArea = W - PAD_LEFT - PAD_RIGHT;
      const barHeight = H - PAD_TOP - PAD_BOTTOM;
      const barW = Math.floor(barArea / Math.max(points.length, 1)) - 4;
      const maxVal = Math.max(...points.map((d) => d.value), 1);

      const shapes = [];

      // Grid lines
      if (grid) {
        for (let i = 0; i <= 4; i++) {
          const y = PAD_TOP + (barHeight * i) / 4;
          shapes.push(
            rect({
              x: String(PAD_LEFT),
              y: String(Math.round(y)),
              width: String(barArea),
              height: "1",
              fill: "#334155",
            }),
          );
        }
      }

      // Title
      shapes.push(
        canvasText({
          x: String(W / 2),
          y: "16",
          content: title,
          font: "bold 13px Inter, sans-serif",
          fill: "#94a3b8",
          textAlign: "center",
        }),
      );

      // Bars
      for (let i = 0; i < points.length; i++) {
        const dp = points[i];
        const x = PAD_LEFT + i * (barW + 4) + 2;
        const h = Math.round((dp.value / maxVal) * barHeight);
        const y = PAD_TOP + barHeight - h;

        shapes.push(
          rect({
            x: String(x),
            y: String(y),
            width: String(barW),
            height: String(h),
            fill: dp.color,
          }),
        );

        // Value label
        shapes.push(
          canvasText({
            x: String(x + barW / 2),
            y: String(y - 4),
            content: String(dp.value),
            font: "11px monospace",
            fill: "#94a3b8",
            textAlign: "center",
          }),
        );

        // Category label
        shapes.push(
          canvasText({
            x: String(x + barW / 2),
            y: String(H - 6),
            content: dp.label,
            font: "11px Inter, sans-serif",
            fill: "#64748b",
            textAlign: "center",
          }),
        );
      }

      return shapes;
    });
  });

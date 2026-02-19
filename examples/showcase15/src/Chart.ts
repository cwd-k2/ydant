/**
 * Showcase 15 — Canvas bar chart scene
 *
 * Canvas scope 下で動作する棒グラフ。
 * reactive() で signal を購読し、VShape ツリーを自動更新する。
 */

import { group, rect, canvasText } from "@ydant/canvas";
import { attr } from "@ydant/base";
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
            rect(() => [
              attr("x", String(PAD_LEFT)),
              attr("y", String(Math.round(y))),
              attr("width", String(barArea)),
              attr("height", "1"),
              attr("fill", "#334155"),
            ]),
          );
        }
      }

      // Title
      shapes.push(
        canvasText(() => [
          attr("x", String(W / 2)),
          attr("y", "16"),
          attr("content", title),
          attr("font", "bold 13px Inter, sans-serif"),
          attr("fill", "#94a3b8"),
          attr("textAlign", "center"),
        ]),
      );

      // Bars
      for (let i = 0; i < points.length; i++) {
        const dp = points[i];
        const x = PAD_LEFT + i * (barW + 4) + 2;
        const h = Math.round((dp.value / maxVal) * barHeight);
        const y = PAD_TOP + barHeight - h;

        shapes.push(
          rect(() => [
            attr("x", String(x)),
            attr("y", String(y)),
            attr("width", String(barW)),
            attr("height", String(h)),
            attr("fill", dp.color),
          ]),
        );

        // Value label
        shapes.push(
          canvasText(() => [
            attr("x", String(x + barW / 2)),
            attr("y", String(y - 4)),
            attr("content", String(dp.value)),
            attr("font", "11px monospace"),
            attr("fill", "#94a3b8"),
            attr("textAlign", "center"),
          ]),
        );

        // Category label
        shapes.push(
          canvasText(() => [
            attr("x", String(x + barW / 2)),
            attr("y", String(H - 6)),
            attr("content", dp.label),
            attr("font", "11px Inter, sans-serif"),
            attr("fill", "#64748b"),
            attr("textAlign", "center"),
          ]),
        );
      }

      return shapes;
    });
  });

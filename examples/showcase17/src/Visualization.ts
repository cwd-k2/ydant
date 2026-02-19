/**
 * Showcase 17 — Canvas detail visualization
 *
 * 選択されたカラーの詳細を Canvas に描画。
 * engine.on() で DOM からのメッセージを受信し、シーンを更新する。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { attr } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { signal } from "@ydant/reactive";
import type { ColorInfo } from "./palette";
import { ALL_COLORS, appendLog } from "./palette";

const W = 560;
const H = 360;

// Local signals driven by engine.on() messages
const displayColor = signal<ColorInfo>(ALL_COLORS[0]);
const highlightIdx = signal<number | null>(null);

/**
 * Register message handlers on the canvas engine.
 * Called from index.ts after embed.
 */
export function registerHandlers(engine: import("@ydant/core").Engine) {
  engine.on("color:select", (msg) => {
    const color = msg.color as ColorInfo;
    displayColor.set(color);
    appendLog({ direction: "canvas", type: "color:select", payload: color.name });
  });

  engine.on("color:highlight", (msg) => {
    highlightIdx.set(msg.index as number | null);
  });
}

export const Visualization = () =>
  group(function* () {
    yield* reactive(() => {
      const color = displayColor();
      const hlIdx = highlightIdx();
      const shapes = [];

      // Background
      shapes.push(
        rect(() => [
          attr("x", "0"),
          attr("y", "0"),
          attr("width", String(W)),
          attr("height", String(H)),
          attr("fill", "#0f172a"),
        ]),
      );

      // Main color circle
      const cx = 180;
      const cy = 140;
      const r = 80;

      // Shadow
      shapes.push(
        circle(() => [
          attr("cx", String(cx + 4)),
          attr("cy", String(cy + 4)),
          attr("r", String(r)),
          attr("fill", "rgba(0,0,0,0.3)"),
        ]),
      );

      // Main circle
      shapes.push(
        circle(() => [
          attr("cx", String(cx)),
          attr("cy", String(cy)),
          attr("r", String(r)),
          attr("fill", color.hex),
        ]),
      );

      // Color name
      shapes.push(
        canvasText(() => [
          attr("x", String(cx)),
          attr("y", String(cy + r + 24)),
          attr("content", color.name),
          attr("font", "bold 16px Inter, sans-serif"),
          attr("fill", "#e2e8f0"),
          attr("textAlign", "center"),
        ]),
      );

      // Hex value
      shapes.push(
        canvasText(() => [
          attr("x", String(cx)),
          attr("y", String(cy + r + 44)),
          attr("content", color.hex),
          attr("font", "13px monospace"),
          attr("fill", "#94a3b8"),
          attr("textAlign", "center"),
        ]),
      );

      // RGB bars
      const barX = 340;
      const barW = 180;
      const barH = 20;
      const channels = [
        { label: "R", value: color.r, color: "#ef4444" },
        { label: "G", value: color.g, color: "#22c55e" },
        { label: "B", value: color.b, color: "#3b82f6" },
      ];

      for (let i = 0; i < channels.length; i++) {
        const ch = channels[i];
        const y = 60 + i * 50;
        const w = Math.round((ch.value / 255) * barW);

        // Label
        shapes.push(
          canvasText(() => [
            attr("x", String(barX)),
            attr("y", String(y - 6)),
            attr("content", `${ch.label}: ${ch.value}`),
            attr("font", "12px monospace"),
            attr("fill", "#94a3b8"),
          ]),
        );

        // Track
        shapes.push(
          rect(() => [
            attr("x", String(barX)),
            attr("y", String(y)),
            attr("width", String(barW)),
            attr("height", String(barH)),
            attr("fill", "#1e293b"),
          ]),
        );

        // Fill
        shapes.push(
          rect(() => [
            attr("x", String(barX)),
            attr("y", String(y)),
            attr("width", String(w)),
            attr("height", String(barH)),
            attr("fill", ch.color),
          ]),
        );
      }

      // Complementary color
      const compR = 255 - color.r;
      const compG = 255 - color.g;
      const compB = 255 - color.b;
      const compHex = `#${((1 << 24) + (compR << 16) + (compG << 8) + compB).toString(16).slice(1)}`;

      shapes.push(
        canvasText(() => [
          attr("x", String(barX)),
          attr("y", "260"),
          attr("content", `Complement: ${compHex}`),
          attr("font", "12px monospace"),
          attr("fill", "#94a3b8"),
        ]),
      );
      shapes.push(
        circle(() => [
          attr("cx", String(barX + 160)),
          attr("cy", "254"),
          attr("r", "12"),
          attr("fill", compHex),
        ]),
      );

      // Mini palette at bottom with highlight
      const miniY = H - 40;
      const miniR = 10;
      const miniGap = 28;
      const startX = (W - ALL_COLORS.length * miniGap) / 2 + miniR;

      for (let i = 0; i < ALL_COLORS.length; i++) {
        const c = ALL_COLORS[i];
        const isHl = hlIdx === i;
        const isSel = c.hex === color.hex;
        const cr = isHl ? miniR + 4 : isSel ? miniR + 2 : miniR;

        if (isHl || isSel) {
          shapes.push(
            circle(() => [
              attr("cx", String(startX + i * miniGap)),
              attr("cy", String(miniY)),
              attr("r", String(cr + 2)),
              attr("fill", isHl ? "#7dd3fc" : "#475569"),
            ]),
          );
        }

        shapes.push(
          circle(() => [
            attr("cx", String(startX + i * miniGap)),
            attr("cy", String(miniY)),
            attr("r", String(cr)),
            attr("fill", c.hex),
          ]),
        );
      }

      return shapes;
    });
  });

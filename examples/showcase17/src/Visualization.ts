/**
 * Showcase 17 — Canvas detail visualization
 *
 * 選択されたカラーの詳細を Canvas に描画。
 * engine.on() で DOM からのメッセージを受信し、シーンを更新する。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { reactive, signal } from "@ydant/reactive";
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
      shapes.push(rect({ x: "0", y: "0", width: String(W), height: String(H), fill: "#0f172a" }));

      // Main color circle
      const cx = 180;
      const cy = 140;
      const r = 80;

      // Shadow
      shapes.push(
        circle({
          cx: String(cx + 4),
          cy: String(cy + 4),
          r: String(r),
          fill: "rgba(0,0,0,0.3)",
        }),
      );

      // Main circle
      shapes.push(circle({ cx: String(cx), cy: String(cy), r: String(r), fill: color.hex }));

      // Color name
      shapes.push(
        canvasText({
          x: String(cx),
          y: String(cy + r + 24),
          content: color.name,
          font: "bold 16px Inter, sans-serif",
          fill: "#e2e8f0",
          textAlign: "center",
        }),
      );

      // Hex value
      shapes.push(
        canvasText({
          x: String(cx),
          y: String(cy + r + 44),
          content: color.hex,
          font: "13px monospace",
          fill: "#94a3b8",
          textAlign: "center",
        }),
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
          canvasText({
            x: String(barX),
            y: String(y - 6),
            content: `${ch.label}: ${ch.value}`,
            font: "12px monospace",
            fill: "#94a3b8",
          }),
        );

        // Track
        shapes.push(
          rect({
            x: String(barX),
            y: String(y),
            width: String(barW),
            height: String(barH),
            fill: "#1e293b",
          }),
        );

        // Fill
        shapes.push(
          rect({
            x: String(barX),
            y: String(y),
            width: String(w),
            height: String(barH),
            fill: ch.color,
          }),
        );
      }

      // Complementary color
      const compR = 255 - color.r;
      const compG = 255 - color.g;
      const compB = 255 - color.b;
      const compHex = `#${((1 << 24) + (compR << 16) + (compG << 8) + compB).toString(16).slice(1)}`;

      shapes.push(
        canvasText({
          x: String(barX),
          y: "260",
          content: `Complement: ${compHex}`,
          font: "12px monospace",
          fill: "#94a3b8",
        }),
      );
      shapes.push(circle({ cx: String(barX + 160), cy: "254", r: "12", fill: compHex }));

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
            circle({
              cx: String(startX + i * miniGap),
              cy: String(miniY),
              r: String(cr + 2),
              fill: isHl ? "#7dd3fc" : "#475569",
            }),
          );
        }

        shapes.push(
          circle({
            cx: String(startX + i * miniGap),
            cy: String(miniY),
            r: String(cr),
            fill: c.hex,
          }),
        );
      }

      return shapes;
    });
  });

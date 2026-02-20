/**
 * Showcase 16 — High-priority Canvas scene
 *
 * 少数の大きなパーティクルを描画。常にアクティブ。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { reactive } from "@ydant/reactive";
import { highParticles } from "./particles";

export const HighScene = () =>
  group(function* () {
    yield* reactive(() => {
      const particles = highParticles();
      const shapes = [];

      // Background
      shapes.push(rect({ x: "0", y: "0", width: "430", height: "300", fill: "#0f172a" }));

      // Particles with glow effect
      for (const p of particles) {
        // Glow
        shapes.push(
          circle({
            cx: String(Math.round(p.x)),
            cy: String(Math.round(p.y)),
            r: String(Math.round(p.r + 6)),
            fill: `${p.color}33`,
          }),
        );
        // Body
        shapes.push(
          circle({
            cx: String(Math.round(p.x)),
            cy: String(Math.round(p.y)),
            r: String(Math.round(p.r)),
            fill: p.color,
          }),
        );
      }

      // Count label
      shapes.push(
        canvasText({
          x: "8",
          y: "16",
          content: `High: ${particles.length} particles`,
          font: "11px monospace",
          fill: "#94a3b8",
        }),
      );

      return shapes;
    });
  });

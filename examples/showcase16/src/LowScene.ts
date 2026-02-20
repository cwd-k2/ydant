/**
 * Showcase 16 — Low-priority Canvas scene
 *
 * 多数の小さなパーティクルを描画。フレーム予算超過時に pause される。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { reactive } from "@ydant/reactive";
import { lowParticles } from "./particles";

export const LowScene = () =>
  group(function* () {
    yield* reactive(() => {
      const particles = lowParticles();
      const shapes = [];

      // Background
      shapes.push(rect({ x: "0", y: "0", width: "430", height: "300", fill: "#0f172a" }));

      // Particles (small dots)
      for (const p of particles) {
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
          content: `Low: ${particles.length} particles`,
          font: "11px monospace",
          fill: "#94a3b8",
        }),
      );

      return shapes;
    });
  });

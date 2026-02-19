/**
 * Showcase 16 — Low-priority Canvas scene
 *
 * 多数の小さなパーティクルを描画。フレーム予算超過時に pause される。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { attr } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { lowParticles } from "./particles";

export const LowScene = () =>
  group(function* () {
    yield* reactive(() => {
      const particles = lowParticles();
      const shapes = [];

      // Background
      shapes.push(
        rect(() => [
          attr("x", "0"),
          attr("y", "0"),
          attr("width", "430"),
          attr("height", "300"),
          attr("fill", "#0f172a"),
        ]),
      );

      // Particles (small dots)
      for (const p of particles) {
        shapes.push(
          circle(() => [
            attr("cx", String(Math.round(p.x))),
            attr("cy", String(Math.round(p.y))),
            attr("r", String(Math.round(p.r))),
            attr("fill", p.color),
          ]),
        );
      }

      // Count label
      shapes.push(
        canvasText(() => [
          attr("x", "8"),
          attr("y", "16"),
          attr("content", `Low: ${particles.length} particles`),
          attr("font", "11px monospace"),
          attr("fill", "#94a3b8"),
        ]),
      );

      return shapes;
    });
  });

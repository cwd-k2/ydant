/**
 * Showcase 16 — High-priority Canvas scene
 *
 * 少数の大きなパーティクルを描画。常にアクティブ。
 */

import { group, rect, circle, canvasText } from "@ydant/canvas";
import { attr } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { highParticles } from "./particles";

export const HighScene = () =>
  group(function* () {
    yield* reactive(() => {
      const particles = highParticles();
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

      // Particles with glow effect
      for (const p of particles) {
        // Glow
        shapes.push(
          circle(() => [
            attr("cx", String(Math.round(p.x))),
            attr("cy", String(Math.round(p.y))),
            attr("r", String(Math.round(p.r + 6))),
            attr("fill", `${p.color}33`),
          ]),
        );
        // Body
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
          attr("content", `High: ${particles.length} particles`),
          attr("font", "11px monospace"),
          attr("fill", "#94a3b8"),
        ]),
      );

      return shapes;
    });
  });

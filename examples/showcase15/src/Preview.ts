/**
 * Showcase 15 — SSR preview card
 *
 * SSR scope 下で動作するコンポーネント。
 * dataPoints を参照して <table> をレンダリングする。
 * SSR engine flush 時に toHTML() が呼ばれ、
 * その結果が htmlPreview signal 経由で DOM 側に反映される。
 */

import { html, attr, text } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { dataPoints, chartTitle } from "./signals";

const { div, h2, table, thead, tbody, tr, th, td } = html;

export const Preview = () =>
  div(function* () {
    yield* attr("class", "card");

    yield* reactive(() => {
      const title = chartTitle();
      const points = dataPoints();
      const total = points.reduce((sum, d) => sum + d.value, 0);

      return [
        h2(() => [text(title)]),
        table(function* () {
          yield* thead(() => [
            tr(function* () {
              yield* th(() => [text("Label")]);
              yield* th(() => [text("Value")]);
              yield* th(() => [text("%")]);
            }),
          ]);
          yield* tbody(function* () {
            for (const dp of points) {
              yield* tr(function* () {
                yield* td(() => [text(dp.label)]);
                yield* td(() => [text(String(dp.value))]);
                yield* td(() => [text(`${Math.round((dp.value / total) * 100)}%`)]);
              });
            }
          });
        }),
      ];
    });
  });

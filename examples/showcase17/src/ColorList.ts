/**
 * Showcase 17 — DOM master list component
 *
 * カラーパレットのフィルタリング付きリスト。
 * クリック/ホバーで hub.dispatch() を使って Canvas Engine にメッセージを送る。
 */

import type { Engine, Hub } from "@ydant/core";
import { html, attr, on } from "@ydant/base";
import { reactive } from "@ydant/reactive";
import { filter, filteredColors, selectedIndex, highlightIndex, appendLog } from "./palette";

const { div, ul, li, span, input } = html;

// Engine references (set from index.ts after embed)
let _canvasEngine: Engine | undefined;
let _hub: Hub | undefined;

export function setEngineRefs(canvasEngine: Engine, hub: Hub) {
  _canvasEngine = canvasEngine;
  _hub = hub;
}

function dispatchToCanvas(type: string, payload: Record<string, unknown>) {
  if (_canvasEngine && _hub) {
    _hub.dispatch(_canvasEngine, { type, ...payload });
    appendLog({
      direction: "dom",
      type,
      payload: JSON.stringify(payload),
    });
  }
}

export const ColorList = () =>
  div(function* () {
    yield* div({ classes: ["panel-title"] }, "Color Palette");

    // Filter input
    yield* input({
      classes: ["filter-input"],
      placeholder: "Filter colors...",
      onInput: (e: Event) => {
        filter.set((e.target as HTMLInputElement).value);
      },
    });

    // Color list (reactive)
    yield* reactive(() => {
      const colors = filteredColors();
      const selIdx = selectedIndex();
      const hlIdx = highlightIndex();

      return [
        ul({ classes: ["color-list"] }, function* () {
          for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            const isActive = i === selIdx;
            const classStr = `color-item${isActive ? " active" : ""}`;

            yield* li(function* () {
              yield* attr("class", classStr);
              yield* on("click", () => {
                selectedIndex.set(i);
                dispatchToCanvas("color:select", { color });
              });
              yield* on("mouseenter", () => {
                highlightIndex.set(i);
                dispatchToCanvas("color:highlight", { index: i });
              });
              yield* on("mouseleave", () => {
                highlightIndex.set(null);
                dispatchToCanvas("color:highlight", { index: null });
              });

              yield* span(function* () {
                yield* attr("class", "color-swatch");
                yield* attr("style", `background: ${color.hex}`);
              });
              yield* span({ classes: ["color-name"] }, color.name);
              yield* span({ classes: ["color-hex"] }, color.hex);
            });
          }
        }),
      ];
    });
  });

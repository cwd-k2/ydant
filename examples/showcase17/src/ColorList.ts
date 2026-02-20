/**
 * Showcase 17 — DOM master list component
 *
 * カラーパレットのフィルタリング付きリスト。
 * クリック/ホバーで hub.dispatch() を使って Canvas Engine にメッセージを送る。
 */

import type { Engine, Hub } from "@ydant/core";
import { html } from "@ydant/base";
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
    yield* div({ class: "panel-title" }, "Color Palette");

    // Filter input
    yield* input({
      class: "filter-input",
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
        ul({ class: "color-list" }, function* () {
          for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            const isActive = i === selIdx;
            const classStr = `color-item${isActive ? " active" : ""}`;

            yield* li(
              {
                class: classStr,
                onClick: () => {
                  selectedIndex.set(i);
                  dispatchToCanvas("color:select", { color });
                },
                onMouseenter: () => {
                  highlightIndex.set(i);
                  dispatchToCanvas("color:highlight", { index: i });
                },
                onMouseleave: () => {
                  highlightIndex.set(null);
                  dispatchToCanvas("color:highlight", { index: null });
                },
              },
              function* () {
                yield* span({ class: "color-swatch", style: `background: ${color.hex}` });
                yield* span({ class: "color-name" }, color.name);
                yield* span({ class: "color-hex" }, color.hex);
              },
            );
          }
        }),
      ];
    });
  });

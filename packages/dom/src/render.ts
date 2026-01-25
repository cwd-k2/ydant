/**
 * レンダリング処理
 */

import type { Element, Render, Slot } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { DomPlugin } from "./plugin";
import { createRenderContext } from "./context";
import { processElement } from "./element";
import { processIterator } from "./iterator";

/**
 * Render（ジェネレータ）を DOM に描画
 */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, DomPlugin>): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, undefined, undefined, plugins);

  let result = gen.next();

  while (!result.done) {
    const { value } = result;

    if (isTagged(value, "element")) {
      const { slot } = processElement(value as Element, ctx, processIterator);
      result = gen.next(slot);
    } else {
      result = gen.next(undefined as unknown as Slot);
    }
  }
}

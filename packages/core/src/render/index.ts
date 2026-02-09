/**
 * @ydant/core - レンダリング処理
 */

import type { Render, ChildNext, Child } from "../types";
import type { Plugin, RenderAPI } from "../plugin";
import { createRenderContext, createRenderAPIFactory } from "./context";
import { processIterator } from "./iterator";

// RenderAPI ファクトリを遅延初期化
let createRenderAPI: ((ctx: ReturnType<typeof createRenderContext>) => RenderAPI) | null = null;

/**
 * Render（ジェネレータ）を DOM に描画
 */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, Plugin>): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, plugins);

  // RenderAPI ファクトリを初期化
  if (!createRenderAPI) {
    createRenderAPI = createRenderAPIFactory(processIterator);
  }

  let result = gen.next();

  while (!result.done) {
    const value = result.value;

    // Element はプラグインで処理
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = plugins.get(type);

      if (plugin) {
        const api = createRenderAPI(ctx);
        const processResult = plugin.process(value as Child, api);
        result = gen.next(processResult.value as ChildNext);
        continue;
      }
    }

    // 対応するプラグインがない場合はスキップ
    result = gen.next(undefined as ChildNext);
  }
}

// Re-export for internal use
export { processIterator } from "./iterator";
export { createRenderContext, createRenderAPIFactory } from "./context";
export type { RenderContext } from "./types";

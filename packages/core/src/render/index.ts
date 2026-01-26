/**
 * @ydant/core - レンダリング処理
 */

import type { Render, ChildNext, Child } from "../types";
import type { Plugin, PluginAPI } from "../plugin";
import { createRenderContext, createPluginAPIFactory } from "./context";
import { processIterator } from "./iterator";

// PluginAPI ファクトリを遅延初期化
let createPluginAPI: ((ctx: ReturnType<typeof createRenderContext>) => PluginAPI) | null = null;

/**
 * Render（ジェネレータ）を DOM に描画
 */
export function render(gen: Render, parent: HTMLElement, plugins: Map<string, Plugin>): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, undefined, undefined, plugins);

  // PluginAPI ファクトリを初期化
  if (!createPluginAPI) {
    createPluginAPI = createPluginAPIFactory(processIterator);
  }

  let result = gen.next();

  while (!result.done) {
    const value = result.value;

    // Element はプラグインで処理
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = plugins.get(type);

      if (plugin) {
        const api = createPluginAPI(ctx);
        const pluginResult = plugin.process(value as Child, api);
        result = gen.next(pluginResult.value as ChildNext);
        continue;
      }
    }

    // 対応するプラグインがない場合はスキップ
    result = gen.next(undefined as ChildNext);
  }
}

// Re-export for internal use
export { processIterator } from "./iterator";
export { createRenderContext, createPluginAPIFactory } from "./context";
export { executeMount, executeUnmount } from "./lifecycle";
export type { RenderContext } from "./types";

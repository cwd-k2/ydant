/**
 * Context Plugin for DOM Renderer
 *
 * Context API (provide/inject) を DOM レンダラーで処理するプラグイン。
 *
 * @example
 * ```typescript
 * import { createContextPlugin } from "@ydant/context/plugin";
 * import { mount } from "@ydant/core";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createContextPlugin()]
 * });
 * ```
 */

import type {
  Child,
  Plugin,
  PluginAPI,
  PluginAPIExtensions,
  PluginResult,
  RenderContext,
  RenderContextCore,
  RenderContextExtensions,
} from "@ydant/core";
import { isTagged } from "@ydant/core";
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

/**
 * Context プラグインを作成する
 */
export function createContextPlugin(): Plugin {
  return {
    name: "context",
    types: ["context-provide", "context-inject"],
    dependencies: ["base"],

    initContext(
      ctx: RenderContextCore & Partial<RenderContextExtensions>,
      parentCtx?: RenderContext,
    ) {
      // 親コンテキストがあれば値を継承、なければ新規作成
      const parentValues = parentCtx?.contextValues;
      ctx.contextValues = parentValues ? new Map(parentValues) : new Map();
    },

    extendAPI(api: Partial<PluginAPIExtensions>, ctx: RenderContext) {
      const contextValues = ctx.contextValues;
      api.getContext = <T>(id: symbol): T | undefined => {
        return contextValues.get(id) as T | undefined;
      };
      api.setContext = <T>(id: symbol, value: T): void => {
        contextValues.set(id, value);
      };
    },

    process(child: Child, api: PluginAPI): PluginResult {
      if (isTagged(child, "context-provide")) {
        // Context に値を設定
        api.setContext(child.context.id, child.value);
        return {};
      }
      if (isTagged(child, "context-inject")) {
        // Context から値を取得
        const value = api.getContext(child.context.id) ?? child.context.defaultValue;
        return { value };
      }

      return {};
    },
  };
}

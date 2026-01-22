/**
 * Context Plugin for DOM Renderer
 *
 * Context API (provide/inject) を DOM レンダラーで処理するプラグイン。
 *
 * @example
 * ```typescript
 * import { createContextPlugin } from "@ydant/context/plugin";
 * import { mount } from "@ydant/dom";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createContextPlugin()]
 * });
 * ```
 */

import type { Child, DomPlugin, PluginAPI, PluginResult } from "@ydant/core";
import type { Context } from "./context";

/**
 * Context プラグインを作成する
 */
export function createContextPlugin(): DomPlugin {
  return {
    name: "context",
    types: ["context-provide", "context-inject"],

    process(child: Child, api: PluginAPI): PluginResult {
      if (child.type === "context-provide") {
        // Context に値を設定
        const { context, value } = child as {
          context: Context<unknown>;
          value: unknown;
        };
        api.setContext(context.id, value);
        return {};
      } else if (child.type === "context-inject") {
        // Context から値を取得
        const { context } = child as { context: Context<unknown> };
        const value = api.getContext(context.id) ?? context.defaultValue;
        return { value };
      }

      return {};
    },
  };
}

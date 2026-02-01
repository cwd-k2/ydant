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

import type { Child, Plugin, PluginAPI, PluginResult } from "@ydant/core";
// base の import で PluginAPIExtensions の augmentation が適用される
import "@ydant/base";
import type { Context } from "./context";

/**
 * Context プラグインを作成する
 */
export function createContextPlugin(): Plugin {
  return {
    name: "context",
    types: ["context-provide", "context-inject"],

    initContext(ctx: Record<string, unknown>, parentCtx?: Record<string, unknown>) {
      // 親コンテキストがあれば値を継承、なければ新規作成
      const parentValues = parentCtx?.contextValues as Map<symbol, unknown> | undefined;
      ctx.contextValues = parentValues ? new Map(parentValues) : new Map();
    },

    extendAPI(api: Record<string, unknown>, ctx: Record<string, unknown>) {
      const contextValues = ctx.contextValues as Map<symbol, unknown>;
      api.getContext = <T>(id: symbol): T | undefined => {
        return contextValues.get(id) as T | undefined;
      };
      api.setContext = <T>(id: symbol, value: T): void => {
        contextValues.set(id, value);
      };
    },

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

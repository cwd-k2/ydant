/**
 * @ydant/core - Child イテレータの処理
 */

import type { Child, Instructor, ChildNext } from "../types";
import type { PluginAPI } from "../plugin";
import type { RenderContext } from "./types";
import { createPluginAPIFactory } from "./context";

// 循環参照を解決するため、PluginAPI ファクトリを遅延初期化
let createPluginAPI: ((ctx: RenderContext) => PluginAPI) | null = null;

/**
 * Child イテレータを処理し、DOM に反映する
 *
 * すべての type はプラグインで処理される。
 * 対応するプラグインがない type はスキップされる。
 */
export function processIterator(iter: Instructor, ctx: RenderContext): void {
  // 初回呼び出し時に PluginAPI ファクトリを初期化
  if (!createPluginAPI) {
    createPluginAPI = createPluginAPIFactory(processIterator);
  }

  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    // プラグインをチェック
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = ctx.plugins.get(type);

      if (plugin) {
        const api = createPluginAPI(ctx);
        const pluginResult = plugin.process(value as Child, api);
        result = iter.next(pluginResult.value as ChildNext);
        continue;
      }
    }

    // 対応するプラグインがない場合はスキップ
    result = iter.next();
  }
}

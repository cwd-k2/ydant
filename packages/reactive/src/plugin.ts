/**
 * Reactive Plugin for DOM Renderer
 *
 * Signal の依存関係を追跡し、自動更新を行うプラグイン。
 *
 * @example
 * ```typescript
 * import { createReactivePlugin } from "@ydant/reactive/plugin";
 * import { mount } from "@ydant/core";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createReactivePlugin()]
 * });
 * ```
 */

import type { Child, Builder, Plugin, PluginAPI, PluginResult } from "@ydant/core";
// base の import で PluginAPIExtensions の augmentation が適用される
import "@ydant/base";
import { runWithSubscriber } from "./tracking";

/**
 * Reactive プラグインを作成する
 */
export function createReactivePlugin(): Plugin {
  return {
    name: "reactive",
    types: ["reactive"],

    process(child: Child, api: PluginAPI): PluginResult {
      const builder = (child as { builder: Builder }).builder;

      // コンテナ要素を作成
      const container = document.createElement("span");
      container.setAttribute("data-reactive", "");
      api.appendChild(container);

      // アンマウントコールバックのリスト
      let unmountCallbacks: Array<() => void> = [];

      // 更新関数
      const update = () => {
        // 古いアンマウントコールバックを実行
        for (const callback of unmountCallbacks) {
          callback();
        }
        unmountCallbacks = [];

        // DOM をクリアして再構築
        container.innerHTML = "";

        // Signal 依存関係を追跡しながら子要素を処理
        runWithSubscriber(update, () => {
          api.processChildren(builder, { parent: container });
        });
      };

      // 初回レンダリング
      update();

      // アンマウント時のクリーンアップ
      api.onUnmount(() => {
        for (const callback of unmountCallbacks) {
          callback();
        }
      });

      return {};
    },
  };
}

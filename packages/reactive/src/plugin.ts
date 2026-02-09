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

import type { Child, Plugin, RenderAPI, ProcessResult } from "@ydant/core";
import { isTagged } from "@ydant/core";
// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";
import { runWithSubscriber } from "./tracking";

/**
 * Reactive プラグインを作成する
 */
export function createReactivePlugin(): Plugin {
  return {
    name: "reactive",
    types: ["reactive"],
    dependencies: ["base"],

    process(child: Child, api: RenderAPI): ProcessResult {
      if (!isTagged(child, "reactive")) return {};
      const builder = child.builder;

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

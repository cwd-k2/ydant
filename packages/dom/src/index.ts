/**
 * @ydant/dom
 *
 * DOM レンダリングエンジン
 */

import type { Component } from "@ydant/core";
import type { DomPlugin, MountOptions } from "./plugin";
import { render } from "./render";

// Re-export plugin types
export type { DomPlugin, PluginAPI, PluginResult, MountOptions } from "./plugin";

/**
 * Component を DOM にマウントする
 *
 * @param app - マウントするコンポーネント
 * @param parent - マウント先の DOM 要素
 * @param options - マウントオプション（プラグインなど）
 *
 * @example
 * ```typescript
 * import { mount } from "@ydant/dom";
 * import { createReactivePlugin } from "@ydant/reactive";
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createReactivePlugin()],
 * });
 * ```
 */
export function mount(app: Component, parent: HTMLElement, options?: MountOptions): void {
  // プラグインを Map に変換（type -> plugin）
  const plugins = new Map<string, DomPlugin>();

  if (options?.plugins) {
    for (const plugin of options.plugins) {
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }
  }

  render(app(), parent, plugins);
}

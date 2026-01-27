/**
 * @ydant/core - マウント関数
 */

import type { Plugin, MountOptions } from "./plugin";
import type { Render } from "./types";
import { render } from "./render";

// Component の戻り値型は Render（Generator ベース）
// base で PluginReturnExtensions に Slot が追加されると、より具体的な型になる
type Component = () => Render;

/**
 * Component を DOM にマウントする
 *
 * @param app - マウントするコンポーネント
 * @param parent - マウント先の DOM 要素
 * @param options - マウントオプション（プラグインなど）
 *
 * @example
 * ```typescript
 * import { mount } from "@ydant/core";
 * import { createBasePlugin, div, text } from "@ydant/base";
 *
 * const App = () => div(() => [text("Hello!")]);
 *
 * mount(App, document.getElementById("app")!, {
 *   plugins: [createBasePlugin()],
 * });
 * ```
 */
export function mount(app: Component, parent: HTMLElement, options?: MountOptions): void {
  // プラグインを Map に変換（type -> plugin）
  const plugins = new Map<string, Plugin>();

  if (options?.plugins) {
    for (const plugin of options.plugins) {
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }
  }

  render(app(), parent, plugins);
}

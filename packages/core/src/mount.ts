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
  const pluginNames = new Set<string>();

  if (options?.plugins) {
    for (const plugin of options.plugins) {
      pluginNames.add(plugin.name);
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }

    // 依存関係の検証
    for (const plugin of options.plugins) {
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!pluginNames.has(dep)) {
            console.warn(
              `[ydant] Plugin "${plugin.name}" depends on "${dep}", but "${dep}" is not registered.`,
            );
          }
        }
      }
    }
  }

  render(app(), parent, plugins);
}

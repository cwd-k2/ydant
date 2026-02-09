/**
 * @ydant/core - Mount function
 */

import type { Plugin, MountOptions } from "./plugin";
import type { Render } from "./types";
import { render } from "./render";

type Component = () => Render;

/**
 * Mounts a component into the DOM, starting the rendering pipeline.
 *
 * Registers plugins, validates their dependencies, and renders
 * the component's generator into the target element.
 *
 * @param app - The root component to render.
 * @param parent - The DOM element to render into.
 * @param options - Configuration including plugins to register.
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
  // Build a lookup map: type tag -> plugin
  const plugins = new Map<string, Plugin>();
  const pluginNames = new Set<string>();

  if (options?.plugins) {
    for (const plugin of options.plugins) {
      pluginNames.add(plugin.name);
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }

    // Validate plugin dependencies
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

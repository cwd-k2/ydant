/**
 * @ydant/core - Mount function
 */

import type { Backend, Plugin } from "./plugin";
import type { Render, CapabilityCheck } from "./types";
import { render } from "./render";

/** A handle returned by {@link mount}, used to dispose the mount scope. */
export interface MountHandle {
  /** Disposes the mount scope, calling plugin teardown in reverse order. */
  dispose(): void;
}

/** Options for {@link mount}. */
export type MountOptions<G extends Render = Render, B extends Backend = Backend> = {
  /** The rendering backend that provides platform-specific capabilities. */
  backend: B;
  /** Plugins to register for this mount scope. */
  plugins?: Plugin[];
} & CapabilityCheck<G, B>;

/**
 * Mounts a component into the given root node, starting the rendering pipeline.
 *
 * Registers plugins, validates their dependencies, calls setup hooks,
 * and renders the component's generator into the target.
 *
 * @param app - The root component to render.
 * @param options - Configuration including backend and plugins.
 * @returns A handle to dispose the mount scope.
 *
 * @example
 * ```typescript
 * import { mount } from "@ydant/core";
 * import { createDOMBackend, createBasePlugin, div, text } from "@ydant/base";
 *
 * const App = () => div(() => [text("Hello!")]);
 *
 * const handle = mount(App, {
 *   backend: createDOMBackend(document.getElementById("app")!),
 *   plugins: [createBasePlugin()],
 * });
 *
 * // Later: handle.dispose();
 * ```
 */
export function mount<G extends Render, B extends Backend>(
  app: () => G,
  options: MountOptions<G, B>,
): MountHandle {
  const { backend, plugins: pluginList } = options;

  // Build a lookup map: type tag -> plugin
  const plugins = new Map<string, Plugin>();
  const pluginNames = new Set<string>();

  if (pluginList) {
    for (const plugin of pluginList) {
      pluginNames.add(plugin.name);
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }

    // Validate plugin dependencies
    for (const plugin of pluginList) {
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

  // Render, then call setup on each plugin with the root context
  const rootCtx = render(app(), backend, plugins, pluginList ?? []);

  // Call setup on each unique plugin
  if (pluginList) {
    const visited = new Set<string>();
    for (const plugin of pluginList) {
      if (visited.has(plugin.name)) continue;
      visited.add(plugin.name);
      plugin.setup?.(rootCtx);
    }
  }

  let disposed = false;

  return {
    dispose() {
      if (disposed || !pluginList) return;
      disposed = true;
      // Teardown in reverse registration order
      const visited = new Set<string>();
      for (let i = pluginList.length - 1; i >= 0; i--) {
        const plugin = pluginList[i];
        if (visited.has(plugin.name)) continue;
        visited.add(plugin.name);
        plugin.teardown?.(rootCtx);
      }
    },
  };
}

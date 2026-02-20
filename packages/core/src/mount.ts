/**
 * @ydant/core - Mount function
 */

import type { Backend, ExecutionScope, Hub, Plugin, Scheduler } from "./plugin";
import type { Render, CapabilityCheck } from "./types";
import { render } from "./render";
import { createHub } from "./hub";

/** A handle returned by mounting, used to dispose the mount scope. */
export interface MountHandle {
  /** The hub managing engines for this mount scope. */
  readonly hub: Hub;
  /** Disposes the mount scope, calling plugin teardown in reverse order. */
  dispose(): void;
}

/** Options for creating an execution scope. */
export interface ExecutionScopeOptions {
  /** When true, throw on missing plugin dependencies instead of warning. */
  strict?: boolean;
}

/** Options for the internal mount function. */
export type MountOptions<G extends Render = Render, B extends Backend = Backend> = {
  /** The rendering backend that provides platform-specific capabilities. */
  backend: B;
  /** Plugins to register for this mount scope. */
  plugins?: Plugin[];
  /** Override the scheduler for the primary engine (defaults to backend.defaultScheduler, then sync). */
  scheduler?: Scheduler;
  /** When true, throw on missing plugin dependencies instead of warning. */
  strict?: boolean;
} & CapabilityCheck<G, B>;

/**
 * Builds an {@link ExecutionScope} from a backend and plugin list.
 *
 * Constructs the type-tag dispatch map and validates plugin dependencies.
 *
 * Use this to create scopes for embedding within a parent render
 * (e.g., a Canvas scope inside a DOM render via `embed()`).
 */
export function createExecutionScope(
  backend: Backend,
  pluginList: readonly Plugin[],
  options?: ExecutionScopeOptions,
): ExecutionScope {
  const pluginMap = new Map<string, Plugin>();
  const pluginNames = new Set<string>();

  for (const plugin of pluginList) {
    pluginNames.add(plugin.name);
    for (const type of plugin.types) {
      pluginMap.set(type, plugin);
    }
  }

  // Validate plugin dependencies
  for (const plugin of pluginList) {
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!pluginNames.has(dep)) {
          const message = `[ydant] Plugin "${plugin.name}" depends on "${dep}", but "${dep}" is not registered.`;
          if (options?.strict) {
            throw new Error(message);
          }
          console.warn(message);
        }
      }
    }
  }

  return { backend, pluginMap, allPlugins: pluginList };
}

/**
 * Internal mount implementation that takes a pre-built ExecutionScope.
 * Used by both mount() and ScopeBuilder.mount().
 */
export function mountWithScope<G extends Render>(
  execScope: ExecutionScope,
  app: () => G,
  scheduler?: Scheduler,
): MountHandle {
  const allPlugins = execScope.allPlugins;

  // Create the hub and primary engine
  const hub = createHub();
  hub.spawn("primary", execScope, { scheduler });

  // Render (initial render is synchronous — does not go through the engine queue)
  const rootCtx = render(app(), execScope, hub);

  // Call setup on each unique plugin
  const visited = new Set<string>();
  for (const plugin of allPlugins) {
    if (visited.has(plugin.name)) continue;
    visited.add(plugin.name);
    plugin.setup?.(rootCtx);
  }

  let disposed = false;

  return {
    hub,
    dispose() {
      if (disposed) return;
      disposed = true;
      // Teardown in reverse registration order
      const visited = new Set<string>();
      for (let i = allPlugins.length - 1; i >= 0; i--) {
        const plugin = allPlugins[i];
        if (visited.has(plugin.name)) continue;
        visited.add(plugin.name);
        plugin.teardown?.(rootCtx);
      }
      hub.dispose();
    },
  };
}

/**
 * Internal mount function. Prefer `scope(backend, plugins).mount(app)` for public usage.
 *
 * @internal
 */
export function mount<G extends Render, B extends Backend>(
  app: () => G,
  options: MountOptions<G, B>,
): MountHandle {
  const { backend, plugins: pluginList, scheduler, strict } = options;
  const allPlugins = pluginList ?? [];
  const execScope = createExecutionScope(backend, allPlugins, { strict });
  return mountWithScope(execScope, app, scheduler);
}

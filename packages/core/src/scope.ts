/**
 * @ydant/core - Scope builder
 *
 * Provides a unified API for constructing execution scopes and
 * performing mount or embed operations. The embed plugin is
 * automatically registered so users don't need to manage it.
 *
 * @example
 * ```typescript
 * // Mount
 * const handle = scope(createDOMBackend(root), [createBasePlugin()])
 *   .mount(App);
 *
 * // Embed (inside a component)
 * const engine = yield* scope(createCanvasBackend(), [createBasePlugin()])
 *   .embed(Scene);
 * ```
 */

import type { Spell, Builder, Render, CapabilityCheck } from "./types";
import type { Backend, Engine, Plugin, Scheduler } from "./plugin";
import type { Embed } from "./embed";
import { createEmbedPlugin } from "./embed";
import { createExecutionScope, mountWithScope } from "./mount";
import type { ExecutionScopeOptions, MountHandle } from "./mount";

/** Type-level helper: extract the app param type with capability checking. */
type AppParam<G extends Render, C extends string> = () => G & CapabilityCheck<G, Backend<C>>;

/** A builder that provides `.mount()` and `.embed()` terminal operations on a pre-configured scope. */
export interface ScopeBuilder<C extends string = string> {
  /** Mounts a component, returning a handle for disposal. */
  mount<G extends Render>(app: AppParam<G, C>, options?: { scheduler?: Scheduler }): MountHandle;

  /** Embeds content under this scope. Use with `yield*` to get the Engine. */
  embed(content: Builder, options?: { scheduler?: Scheduler }): Spell<"embed">;
}

/**
 * Creates a scope builder from a backend and plugin list.
 *
 * The embed plugin is automatically registered (prepended) so that
 * `.embed()` works without explicit plugin setup.
 *
 * @param backend - The rendering backend.
 * @param plugins - Plugins for this scope.
 * @param options - Scope creation options (e.g., strict dependency checking).
 */
export function scope<C extends string>(
  backend: Backend<C>,
  plugins: Plugin[],
  options?: ExecutionScopeOptions,
): ScopeBuilder<C> {
  // Auto-register embed plugin if not already present
  const hasEmbed = plugins.some((p) => p.name === "embed");
  const allPlugins = hasEmbed ? plugins : [createEmbedPlugin(), ...plugins];

  const execScope = createExecutionScope(backend, allPlugins, options);

  return {
    mount(app, options?) {
      return mountWithScope(execScope, app as () => Render, options?.scheduler);
    },

    *embed(content: Builder, options?: { scheduler?: Scheduler }): Spell<"embed"> {
      return (yield {
        type: "embed",
        scope: execScope,
        content,
        scheduler: options?.scheduler,
      } as Embed) as Engine;
    },
  };
}

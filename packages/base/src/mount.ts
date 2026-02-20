/**
 * @ydant/base - Convenience mount
 *
 * `scope(createDOMBackend(root), [createBasePlugin()]).mount(App)` の
 * ボイラープレートを `mount("#app", App)` に簡素化する。
 */

import type { Render, CapabilityCheck, Plugin, Scheduler, MountHandle, Backend } from "@ydant/core";
import { scope } from "@ydant/core";
import { createBasePlugin } from "./plugin/index";
import { createDOMBackend } from "./capabilities";
import type { DOMBackendOptions, DOMCapabilityNames } from "./capabilities";

/** Type-level helper: extract the app param type with DOM capability checking. */
type AppParam<G extends Render> = () => G & CapabilityCheck<G, Backend<DOMCapabilityNames>>;

export interface MountOptions {
  plugins?: Plugin[];
  scheduler?: Scheduler;
  backend?: DOMBackendOptions;
}

/**
 * Mounts a component into the DOM with sensible defaults.
 *
 * Equivalent to:
 * ```typescript
 * scope(createDOMBackend(root), [createBasePlugin(), ...plugins]).mount(app)
 * ```
 *
 * @param target - CSS selector string or DOM Element.
 * @param app - Root component function.
 * @param options - Additional plugins, scheduler, or backend options.
 */
export function mount<G extends Render>(
  target: string | Element,
  app: AppParam<G>,
  options?: MountOptions,
): MountHandle {
  const root = typeof target === "string" ? document.querySelector(target) : target;
  if (!root) throw new Error(`[ydant] Mount target not found: ${target}`);
  const plugins: Plugin[] = [createBasePlugin(), ...(options?.plugins ?? [])];
  return scope(createDOMBackend(root, options?.backend), plugins).mount(
    app as () => Render,
    options?.scheduler ? { scheduler: options.scheduler } : undefined,
  );
}

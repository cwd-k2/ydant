/**
 * @ydant/ssr - renderToString helper
 *
 * コンポーネントを HTML 文字列にワンショットでレンダリングする。
 */

import type { Component, Plugin } from "@ydant/core";
import { mount } from "@ydant/core";
import { createBasePlugin } from "@ydant/base";
import { createSSRBackend } from "./target";

export interface RenderToStringOptions {
  plugins?: Plugin[];
}

/**
 * Renders a component to an HTML string.
 *
 * Internally creates an SSR backend, mounts the component, serializes
 * the resulting VNode tree, and disposes the mount scope.
 *
 * @param app - The root component to render.
 * @param options - Optional plugins. Defaults to `[createBasePlugin()]`.
 * @returns The rendered HTML string.
 */
export function renderToString(app: Component, options?: RenderToStringOptions): string {
  const backend = createSSRBackend();
  const userPlugins = options?.plugins ?? [createBasePlugin()];
  const handle = mount(app, {
    backend,
    plugins: userPlugins,
  });
  const html = backend.toHTML();
  handle.dispose();
  return html;
}

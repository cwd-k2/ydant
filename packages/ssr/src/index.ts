/**
 * @ydant/ssr
 *
 * Server-side rendering and hydration for Ydant.
 * SSR: renders components to HTML strings using a virtual node tree.
 * Hydration: walks existing DOM to attach event listeners and Slot references.
 */

// VNode types
export type { VElement, VText, VRoot, VNode, VContainer } from "./vnode";

// SSR backend
export type { SSRBackend } from "./target";
export { createSSRBackend } from "./target";

// SSR high-level API
export type { RenderToStringOptions } from "./render";
export { renderToString } from "./render";

// Node resolver
export { createDOMNodeResolver } from "./resolver";

// Hydration
export type { HydrateOptions } from "./hydrate";
export { hydrate, createHydrationPlugin } from "./hydrate";

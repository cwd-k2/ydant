/**
 * @ydant/ssr
 *
 * Server-side rendering and hydration for Ydant.
 * SSR: renders components to HTML strings using a virtual node tree.
 * Hydration: walks existing DOM to attach event listeners and Slot references.
 */

// VNode types
export type { VElement, VText, VRoot, VNode, VContainer } from "./vnode";

// SSR capability provider
export type { SSRCapabilities, StringTarget } from "./target";
export { createSSRCapabilities, createStringTarget } from "./target";

// SSR high-level API
export type { RenderToStringOptions } from "./render";
export { renderToString } from "./render";

// Node resolver (capability layer for hydration)
export type { NodeResolver } from "./resolver";
export { createDOMNodeResolver } from "./resolver";

// Hydration
export type { HydrateOptions } from "./hydrate";
export { hydrate, createHydrationPlugin } from "./hydrate";

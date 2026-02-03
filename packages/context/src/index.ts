/**
 * @ydant/context
 *
 * Context API と永続化ヘルパー
 */

// Import base types to ensure module augmentation is loaded
import "@ydant/base";

export { createContext, provide, inject } from "./context";
export type { Context, ContextProvide, ContextInject } from "./context";

export { persist, save, remove, createStorage } from "./persist";

// Plugin
export { createContextPlugin } from "./plugin";

/// <reference path="./global.d.ts" />
/**
 * @ydant/context
 *
 * Context API と永続化ヘルパー
 */

// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type { Context, ContextProvide, ContextInject } from "./context";

// ─── Runtime ───
export { createContext, provide, inject } from "./context";

// ─── Plugin ───
export { createContextPlugin } from "./plugin";

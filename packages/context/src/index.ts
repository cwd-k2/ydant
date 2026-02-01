/**
 * @ydant/context
 *
 * Context API と永続化ヘルパー
 */

// Module augmentation（サイドエフェクト）
import "./global.d";

export { createContext, provide, inject } from "./context";
export type { Context, ContextProvide, ContextInject } from "./context";

export { persist, save, remove, createStorage } from "./persist";

// Plugin
export { createContextPlugin } from "./plugin";

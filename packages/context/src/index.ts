/**
 * @ydant/context
 *
 * Context API と永続化ヘルパー
 */

export { createContext, provide, inject } from "./context";
export type { Context, ContextProvide, ContextInject } from "./context";

export {
  persist,
  save,
  remove,
  createPersistedValue,
  createStorage,
} from "./persist";

// Plugin
export { createContextPlugin } from "./plugin";

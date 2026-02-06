/**
 * @ydant/context - Module Augmentation
 *
 * core の interface を拡張し、context プラグインの型を追加する
 */

import type { ContextProvide, ContextInject } from "./context";

declare module "@ydant/core" {
  // RenderContext に context プラグイン用のプロパティを追加
  interface RenderContextExtensions {
    /** Context の値を保持するマップ */
    contextValues: Map<symbol, unknown>;
  }

  // PluginAPI に context プラグインのメソッドを追加
  interface PluginAPIExtensions {
    /** Context から値を取得 */
    getContext<T>(id: symbol): T | undefined;
    /** Context に値を設定 */
    setContext<T>(id: symbol, value: T): void;
  }

  // context の DSL 型を Child に追加
  interface PluginChildExtensions {
    ContextProvide: ContextProvide;
    ContextInject: ContextInject;
  }

  // inject の戻り値を ChildNext に追加
  interface PluginNextExtensions {
    ContextValue: unknown;
  }

  // inject の戻り値を ChildReturn に追加
  interface PluginReturnExtensions {
    ContextValue: unknown;
  }
}

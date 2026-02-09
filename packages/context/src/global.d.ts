/**
 * @ydant/context - Module Augmentation
 *
 * core の interface を拡張し、context プラグインの型を追加する
 */

import type { ContextProvide, ContextInject } from "./context";

declare module "@ydant/core" {
  // RenderContext に context プラグイン用のプロパティを追加
  interface RenderContextExtension {
    /** Context の値を保持するマップ */
    contextValues: Map<symbol, unknown>;
  }

  // PluginAPI に context プラグインのメソッドを追加
  interface PluginAPI {
    /** Context から値を取得 */
    getContext<T>(id: symbol): T | undefined;
    /** Context に値を設定 */
    setContext<T>(id: symbol, value: T): void;
  }

  // context の DSL 型を Extension に追加
  // "context-inject" の feedback: unknown が ChildReturn にも反映される
  interface Extension {
    "context-provide": { instruction: ContextProvide };
    "context-inject": { instruction: ContextInject; feedback: unknown };
  }
}

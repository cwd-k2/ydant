/**
 * @ydant/reactive - Module Augmentation
 *
 * core の interface を拡張し、reactive プラグインの型を追加する
 */

import type { Reactive } from "./reactive";
import type { ReactiveScope } from "./scope";

declare module "@ydant/core" {
  interface RenderContext {
    reactiveScope: ReactiveScope;
  }

  interface SpellSchema {
    reactive: { request: Reactive };
  }
}

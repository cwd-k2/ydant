/**
 * @ydant/reactive - Module Augmentation
 *
 * core の interface を拡張し、reactive プラグインの型を追加する
 */

import type { Reactive } from "./reactive";

declare module "@ydant/core" {
  interface Extension {
    reactive: { instruction: Reactive };
  }
}

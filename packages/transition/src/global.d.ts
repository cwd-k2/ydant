/**
 * @ydant/transition - Module Augmentation
 *
 * core の interface を拡張し、transition プラグインの型を追加する
 */

import type { TransitionHandle } from "./Transition";

declare module "@ydant/core" {
  // instruction/feedback を持たず、return のみを追加する DSLSchema エントリ
  interface DSLSchema {
    transition: { return: TransitionHandle };
  }
}

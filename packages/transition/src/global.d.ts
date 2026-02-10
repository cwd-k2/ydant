/**
 * @ydant/transition - Module Augmentation
 *
 * core の interface を拡張し、transition プラグインの型を追加する
 */

import type { TransitionHandle } from "./Transition";

declare module "@ydant/core" {
  // request/response を持たず、return のみを追加する SpellSchema エントリ
  interface SpellSchema {
    transition: { return: TransitionHandle };
  }
}

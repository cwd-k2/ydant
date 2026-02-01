/**
 * @ydant/transition - Module Augmentation
 *
 * core の interface を拡張し、transition プラグインの型を追加する
 */

import type { TransitionHandle } from "./Transition";

declare module "@ydant/core" {
  interface PluginReturnExtensions {
    TransitionHandle: TransitionHandle;
  }
}

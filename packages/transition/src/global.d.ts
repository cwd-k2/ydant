/**
 * @ydant/transition - Module Augmentation
 *
 * core の interface を拡張し、transition プラグインの型を追加する
 */

import type { TransitionHandle } from "./Transition";

declare module "@ydant/core" {
  // Return-only entry: adds TransitionHandle to Render's return type union,
  // so that generators using `yield* Transition(...)` remain assignable to Render.
  interface SpellSchema {
    transition: { return: TransitionHandle };
  }
}

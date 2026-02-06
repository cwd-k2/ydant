/// <reference path="./global.d.ts" />
/**
 * @ydant/transition
 *
 * CSS トランジションを適用するためのコンポーネント群
 */

// Ensure module augmentation from @ydant/base is loaded
import "@ydant/base";

// ─── Types ───
export type { TransitionProps, TransitionHandle, TransitionInstruction } from "./Transition";
export type { TransitionGroupProps } from "./TransitionGroup";

// ─── Runtime ───
export { Transition, createTransition, enterTransition, leaveTransition } from "./Transition";
export { TransitionGroup, createTransitionGroupRefresher } from "./TransitionGroup";

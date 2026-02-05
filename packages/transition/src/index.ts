/**
 * @ydant/transition
 *
 * CSS トランジションを適用するためのコンポーネント群
 */

// Import base types to ensure module augmentation is loaded
import "@ydant/base";

export { Transition, createTransition, enterTransition, leaveTransition } from "./Transition";
export type { TransitionProps, TransitionHandle, TransitionRender } from "./Transition";

export { TransitionGroup, createTransitionGroupRefresher } from "./TransitionGroup";
export type { TransitionGroupProps } from "./TransitionGroup";

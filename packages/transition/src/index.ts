/**
 * @ydant/transition
 *
 * CSS トランジションを適用するためのコンポーネント群
 */

// Module augmentation（サイドエフェクト）
import "./global.d";

export { Transition, createTransition, enterTransition, leaveTransition } from "./Transition";
export type { TransitionProps, TransitionHandle } from "./Transition";

export { TransitionGroup, createTransitionGroupRefresher } from "./TransitionGroup";
export type { TransitionGroupProps } from "./TransitionGroup";

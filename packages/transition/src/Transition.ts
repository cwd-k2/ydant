/**
 * Transition component
 *
 * Applies CSS transitions when elements are shown or hidden.
 * Returns a handle with `setShow()` for full enter/leave animation support.
 *
 * @example
 * ```typescript
 * const { setShow } = yield* Transition({
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   content: () => div(() => [text("Content")]),
 * });
 *
 * // Show with animation
 * await setShow(true);
 *
 * // Hide with animation
 * await setShow(false);
 * ```
 */

import type { Builder, Render } from "@ydant/core";
import type { Slot, Element } from "@ydant/base";
import { div, refresh } from "@ydant/base";
import { runTransition } from "./utils";

export interface TransitionProps {
  /** Initial visibility state (defaults to false) */
  show?: boolean;
  /** Base classes applied during the entire enter transition */
  enter?: string;
  /** Classes applied at the start of the enter transition */
  enterFrom?: string;
  /** Classes applied at the end of the enter transition */
  enterTo?: string;
  /** Base classes applied during the entire leave transition */
  leave?: string;
  /** Classes applied at the start of the leave transition */
  leaveFrom?: string;
  /** Classes applied at the end of the leave transition */
  leaveTo?: string;
  /** Factory function that returns the content to transition */
  content: () => Render;
}

/** Run an enter transition on the given element. */
async function enterTransition(el: HTMLElement, props: TransitionProps): Promise<void> {
  return runTransition(el, { base: props.enter, from: props.enterFrom, to: props.enterTo });
}

/** Run a leave transition on the given element. */
async function leaveTransition(el: HTMLElement, props: TransitionProps): Promise<void> {
  return runTransition(el, { base: props.leave, from: props.leaveFrom, to: props.leaveTo });
}

/**
 * Handle returned by `Transition`, providing control over the transition state.
 */
export interface TransitionHandle {
  /** The Slot representing the transition container */
  slot: Slot<HTMLElement>;
  /** Update the show state with an animated transition */
  setShow: (show: boolean) => Promise<void>;
}

/** Return type of `Transition`. Use with `yield*` to obtain a TransitionHandle. */
export type TransitionInstruction = Generator<Element, TransitionHandle, Slot>;

/**
 * Transition with full enter/leave animation support.
 *
 * Creates a container element and manages visibility transitions.
 * The `show` prop controls the initial visibility (defaults to `false`).
 * Use the returned `setShow` function to toggle visibility with animations.
 */
export function* Transition(props: TransitionProps): TransitionInstruction {
  const { content, show: initialShow = false } = props;

  let isShowing = initialShow;
  let isAnimating = false;

  const renderContent: Builder = function* () {
    if (isShowing) {
      yield* content();
    }
  };

  const containerSlot = (yield* div(renderContent)) as Slot<HTMLElement>;

  const setShow = async (show: boolean): Promise<void> => {
    if (show === isShowing || isAnimating) return;

    isAnimating = true;

    if (show) {
      isShowing = true;
      refresh(containerSlot, renderContent);

      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await enterTransition(child, props);
      }
    } else {
      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await leaveTransition(child, props);
      }

      isShowing = false;
      refresh(containerSlot, renderContent);
    }

    isAnimating = false;
  };

  return { slot: containerSlot, setShow };
}

/**
 * Transition component
 *
 * Applies CSS transitions when elements are shown or hidden.
 *
 * @example
 * ```typescript
 * yield* Transition({
 *   show: isVisible,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   content: () => div(() => [text("Content")]),
 * });
 * ```
 */

import type { Builder, Render } from "@ydant/core";
import type { Slot, Element } from "@ydant/base";
import { div, onMount } from "@ydant/base";
import { runTransition } from "./utils";

export interface TransitionProps {
  /** Whether to show the element */
  show: boolean;
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

// WeakMap to persist transition state across renders
const transitionStates = new WeakMap<
  HTMLElement,
  {
    isShowing: boolean;
    isAnimating: boolean;
    childSlot: Slot | null;
  }
>();

/**
 * Transition component
 *
 * Runs an enter animation in response to changes in `show`.
 *
 * Note: The current implementation only supports enter animations.
 * For leave animation support, use `createTransition` instead.
 *
 * @see createTransition - Alternative API that supports leave animations
 */
export function Transition(props: TransitionProps): Render {
  const { show, content } = props;

  return div(function* () {
    // Create a container div (always present in the DOM)
    const containerSlot = yield* div(function* () {
      // Only render content when show is true
      if (show) {
        yield* content();
      }
    });

    yield* onMount(() => {
      const container = containerSlot.node;

      // Retrieve or initialize transition state
      let state = transitionStates.get(container);
      if (!state) {
        state = {
          isShowing: false,
          isAnimating: false,
          childSlot: null,
        };
        transitionStates.set(container, state);
      }

      const child = container.firstElementChild as HTMLElement | null;

      if (show && !state.isShowing) {
        // Enter: false -> true
        state.isShowing = true;
        if (child) {
          enterTransition(child, props);
        }
      } else if (!show && state.isShowing && !state.isAnimating) {
        // Leave: true -> false
        // The child element has already been removed (cleared by refresh),
        // so restoring it for animation would require architectural changes.
        // Instead, we simply update the state here.
        state.isShowing = false;
      }

      // Clean up state on unmount
      return () => {
        transitionStates.delete(container);
      };
    });
  });
}

/**
 * Handle returned by `createTransition`, providing control over the transition state.
 *
 * Supports leave animations by providing a dedicated `setShow` function
 * that manages the animation lifecycle.
 */
export interface TransitionHandle {
  /** The Slot representing the transition container */
  slot: Slot;
  /** Update the show state with an animated transition */
  setShow: (show: boolean) => Promise<void>;
}

/** Return type of `createTransition`. Use with `yield*` to obtain a TransitionHandle. */
export type TransitionInstruction = Generator<Element, TransitionHandle, Slot>;

/**
 * Create a stateful Transition with full enter/leave animation support
 *
 * @example
 * ```typescript
 * const transition = yield* createTransition({
 *   enter: "fade-enter",
 *   enterFrom: "fade-enter-from",
 *   enterTo: "fade-enter-to",
 *   leave: "fade-leave",
 *   leaveFrom: "fade-leave-from",
 *   leaveTo: "fade-leave-to",
 *   content: () => div(() => [text("Content")]),
 * });
 *
 * // Show with animation
 * await transition.setShow(true);
 *
 * // Hide with animation
 * await transition.setShow(false);
 * ```
 */
export function* createTransition(props: Omit<TransitionProps, "show">): TransitionInstruction {
  const { content } = props;

  let isShowing = false;
  let isAnimating = false;

  const renderContent: Builder = function* () {
    if (isShowing) {
      yield* content();
    }
  };

  const containerSlot: Slot = yield* div(renderContent);

  const setShow = async (show: boolean): Promise<void> => {
    if (show === isShowing || isAnimating) {
      return;
    }

    isAnimating = true;

    if (show) {
      // Enter
      isShowing = true;
      containerSlot.refresh(renderContent);

      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await enterTransition(child, props as TransitionProps);
      }
    } else {
      // Leave
      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await leaveTransition(child, props as TransitionProps);
      }

      isShowing = false;
      containerSlot.refresh(renderContent);
    }

    isAnimating = false;
  };

  return {
    slot: containerSlot,
    setShow,
  };
}

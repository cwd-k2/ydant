/**
 * TransitionGroup component
 *
 * Applies CSS transitions when list items are added or removed.
 * Uses keyed() to track elements and detect additions, removals, and moves.
 *
 * @example
 * ```typescript
 * yield* TransitionGroup({
 *   items: todoList,
 *   keyFn: (item) => item.id,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   content: (item) => div(() => [text(item.name)]),
 * });
 * ```
 */

import type { Spell } from "@ydant/core";
import type { Slot } from "@ydant/base";
import { div, keyed, onMount } from "@ydant/base";
import { runTransition } from "./utils";

export interface TransitionGroupProps<T> {
  /** Array of items to apply transitions to */
  items: T[];
  /** Function that returns a unique key for each item */
  keyFn: (item: T) => string | number;
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
  /** Render function for each item (must return an element) */
  content: (item: T, index: number) => Spell<"element">;
}

/** Run an enter transition on the given element. */
async function enterTransition<T>(el: HTMLElement, props: TransitionGroupProps<T>): Promise<void> {
  return runTransition(el, { base: props.enter, from: props.enterFrom, to: props.enterTo });
}

/**
 * Run a leave transition on the given element and remove it from the DOM when complete.
 */
async function leaveTransition<T>(
  el: HTMLElement,
  props: Omit<TransitionGroupProps<T>, "items">,
): Promise<void> {
  // If no leave classes are configured, remove immediately
  if (!props.leave && !props.leaveFrom && !props.leaveTo) {
    el.remove();
    return;
  }

  await runTransition(el, { base: props.leave, from: props.leaveFrom, to: props.leaveTo });
  el.remove();
}

/**
 * TransitionGroup component
 *
 * Combines keyed() with Slot.refresh() to apply CSS transitions
 * when list items are added or removed.
 */
export function* TransitionGroup<T>(props: TransitionGroupProps<T>): Spell<"element"> {
  const { items, keyFn, content } = props;

  // Track the current set of keys
  const currentKeys = new Set<string | number>();
  for (const item of items) {
    currentKeys.add(keyFn(item));
  }

  // Create the container element
  const containerSlot = yield* div(function* () {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemKey = keyFn(item);

      // Assign a key to the component via keyed()
      const itemSlot = yield* keyed(itemKey, content)(item, i);

      // Apply enter transition
      yield* onMount(() => {
        enterTransition(itemSlot.node as HTMLElement, props);
      });
    }
  });

  return containerSlot;
}

/** Internal state for the stateful refresher */
interface RefresherState<T> {
  /** Previous items array */
  prevItems: T[];
  /** Map from key to the corresponding HTMLElement */
  elementsByKey: Map<string | number, HTMLElement>;
}

/**
 * Create a stateful refresher for TransitionGroup
 *
 * Designed to be used with Slot.refresh(). Accepts a new item list and
 * performs a transition-aware update: newly added items get an enter
 * transition, and removed items get a leave transition before being
 * removed from the DOM.
 */
export function createTransitionGroupRefresher<T>(
  props: Omit<TransitionGroupProps<T>, "items">,
): (slot: Slot, items: T[]) => void {
  const { keyFn, content } = props;

  // Maintain state across refreshes
  const state: RefresherState<T> = {
    prevItems: [],
    elementsByKey: new Map(),
  };

  return (slot: Slot, items: T[]) => {
    const newKeys = new Set<string | number>();
    for (const item of items) {
      newKeys.add(keyFn(item));
    }

    // Detect removed items and start leave transitions
    const prevKeys = new Set(state.prevItems.map(keyFn));
    for (const prevKey of prevKeys) {
      if (!newKeys.has(prevKey)) {
        const el = state.elementsByKey.get(prevKey);
        if (el) {
          // Start leave transition (element is removed asynchronously)
          leaveTransition(el, props);
          state.elementsByKey.delete(prevKey);
        }
      }
    }

    // Refresh with the new items
    slot.refresh(function* () {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemKey = keyFn(item);
        const isNew = !prevKeys.has(itemKey);

        // Assign a key to the component via keyed()
        const itemSlot = yield* keyed(itemKey, content)(item, i);

        // Record the element reference
        state.elementsByKey.set(itemKey, itemSlot.node as HTMLElement);

        // Apply enter transition only to newly added elements
        if (isNew) {
          yield* onMount(() => {
            enterTransition(itemSlot.node as HTMLElement, props as TransitionGroupProps<T>);
          });
        }
      }
    });

    // Update state
    state.prevItems = [...items];
  };
}

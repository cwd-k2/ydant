/**
 * @ydant/base - SlotRef helper
 */

import type { Builder } from "@ydant/core";
import type { Slot } from "./types";

/**
 * A mutable reference to a {@link Slot}, enabling imperative updates
 * from event handlers and other callbacks.
 *
 * Bind a Slot with `bind()`, then call `refresh()` to re-render its children.
 */
export interface SlotRef {
  /** The currently bound {@link Slot}, or `null` if not yet bound. */
  readonly current: Slot | null;
  /** Associates this ref with a {@link Slot}. */
  bind(slot: Slot): void;
  /** Re-renders the bound Slot's children. No-op if unbound. */
  refresh(children: Builder): void;
  /** The DOM element of the bound Slot, or `null` if unbound. */
  readonly node: HTMLElement | null;
}

/**
 * Creates a {@link SlotRef} for imperative Slot access.
 *
 * @example
 * ```typescript
 * const counter = createSlotRef();
 * let count = 0;
 *
 * counter.bind(yield* div(function* () {
 *   yield* text(`Count: ${count}`);
 *   yield* button(function* () {
 *     yield* on("click", () => {
 *       count++;
 *       counter.refresh(() => [text(`Count: ${count}`)]);
 *     });
 *     yield* text("Increment");
 *   });
 * }));
 * ```
 */
export function createSlotRef(): SlotRef {
  let _current: Slot | null = null;

  return {
    get current() {
      return _current;
    },
    bind(slot: Slot) {
      _current = slot;
    },
    refresh(children: Builder) {
      if (_current) {
        _current.refresh(children);
      }
    },
    get node() {
      return _current?.node ?? null;
    },
  };
}

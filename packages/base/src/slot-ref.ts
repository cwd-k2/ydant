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
 *
 * @typeParam TNode - The type of the rendered node. Use `createSlotRef<HTMLElement>()`
 *   for typed DOM access.
 */
export interface SlotRef<TNode = unknown> {
  /** The currently bound {@link Slot}, or `null` if not yet bound. */
  readonly current: Slot<TNode> | null;
  /** Associates this ref with a {@link Slot}. */
  bind(slot: Slot): void;
  /** Re-renders the bound Slot's children. No-op if unbound. */
  refresh(children: Builder): void;
  /** The rendered node of the bound Slot, or `null` if unbound. */
  readonly node: TNode | null;
}

/**
 * Creates a {@link SlotRef} for imperative Slot access.
 *
 * @typeParam TNode - The type of the rendered node.
 *
 * @example
 * ```typescript
 * const counter = createSlotRef();
 * let count = 0;
 *
 * counter.bind(yield* div(function* () {
 *   yield* text(`Count: ${count}`);
 *   yield* button({
 *     onClick: () => {
 *       count++;
 *       counter.refresh(() => [text(`Count: ${count}`)]);
 *     },
 *   }, "Increment");
 * }));
 * ```
 */
/**
 * Creates a {@link SlotRef} already bound to the given {@link Slot}.
 *
 * A convenience shorthand for `createSlotRef()` + `bind()`.
 *
 * @example
 * ```typescript
 * const ref = slotRef(yield* div(() => [text("Hello")]));
 * // later: ref.refresh(() => [text("Updated")]);
 * ```
 */
export function slotRef<TNode = unknown>(slot: Slot<TNode>): SlotRef<TNode> {
  const ref = createSlotRef<TNode>();
  ref.bind(slot as Slot);
  return ref;
}

export function createSlotRef<TNode = unknown>(): SlotRef<TNode> {
  let _current: Slot<TNode> | null = null;

  return {
    get current() {
      return _current;
    },
    bind(slot: Slot) {
      _current = slot as Slot<TNode>;
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

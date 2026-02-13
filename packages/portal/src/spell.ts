/**
 * @ydant/portal - Portal spell
 */

import type { Spell, Builder } from "@ydant/core";
import type { Portal } from "./types";

/**
 * Renders children into a different target node (outside the current tree).
 *
 * Useful for modals, tooltips, and dropdowns that need to escape their
 * parent's overflow or stacking context.
 *
 * @param target - The node to render children into.
 * @param content - A builder that yields the portal's children.
 *
 * @example
 * ```typescript
 * yield* portal(document.body, function* () {
 *   yield* div(() => {
 *     yield* attr("class", "modal-overlay");
 *     yield* text("Modal content");
 *   });
 * });
 * ```
 */
export function* portal(target: unknown, content: Builder): Spell<"portal"> {
  yield { type: "portal", target, content } as Portal;
}

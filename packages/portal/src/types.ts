/**
 * @ydant/portal - Type definitions
 */

import type { Tagged, Builder } from "@ydant/core";

/** A portal request — renders children into a different target node. */
export type Portal = Tagged<"portal", { target: unknown; content: Builder }>;

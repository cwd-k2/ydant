/// <reference path="./global.d.ts" />
/**
 * @ydant/portal
 *
 * Portal spell for rendering content into alternate DOM targets.
 */

import "@ydant/base";

// Types
export type { Portal } from "./types";

// Plugin
export { createPortalPlugin } from "./plugin";

// Spell
export { portal } from "./spell";

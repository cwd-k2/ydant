/// <reference path="./global.d.ts" />
/**
 * @ydant/canvas
 *
 * Canvas2D rendering target for Ydant.
 * Builds a virtual shape tree and paints it to a Canvas2D context.
 */

// Types
export type { Shape } from "./types";

// VShape types
export type { VShape, VShapeRoot, VShapeContainer } from "./vshape";

// Backend
export type { CanvasBackend } from "./capabilities";
export { createCanvasBackend } from "./capabilities";

// Plugin
export { createCanvasPlugin } from "./plugin";

// Shape element factories
export { group, rect, circle, ellipse, line, canvasPath, canvasText } from "./elements";

// Paint engine
export { paintShape } from "./paint";

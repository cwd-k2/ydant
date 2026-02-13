/**
 * @ydant/canvas
 *
 * Canvas2D rendering target for Ydant.
 * Builds a virtual shape tree and paints it to a Canvas2D context.
 */

// VShape types
export type { VShape, VShapeRoot, VShapeContainer } from "./vshape";

// Capability provider
export type { CanvasCapabilities } from "./capabilities";
export { createCanvasCapabilities } from "./capabilities";

// Shape element factories
export { group, rect, circle, ellipse, line, canvasPath, canvasText } from "./elements";

// Paint engine
export { paintShape } from "./paint";

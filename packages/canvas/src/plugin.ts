/**
 * @ydant/canvas - Canvas plugin
 *
 * Processes "shape" spell requests using the shared processNode utility.
 * Shape properties are set via element props.
 */

import type { Plugin, Request, Response, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processNode } from "@ydant/base";
import type { Attribute, Listener } from "@ydant/base";
import type { Shape } from "./types";

/** Applies inline decorations (attributes only) to a canvas shape node. */
function applyDecorations(
  decorations: Array<Attribute | Listener> | undefined,
  node: unknown,
  _isReused: boolean,
  ctx: RenderContext,
): void {
  if (!decorations) return;

  for (const decoration of decorations) {
    if (isTagged(decoration, "attribute")) {
      ctx.decorate.setAttribute(node, decoration.key, decoration.value);
    }
    // Listeners are ignored in canvas (no interact capability)
  }
}

/**
 * Creates a plugin that handles "shape" spell requests for Canvas rendering.
 *
 * This plugin delegates to the shared {@link processNode} utility,
 * creating nodes via `ctx.tree.createElement` and applying decorations.
 */
export function createCanvasPlugin(): Plugin {
  return {
    name: "canvas",
    types: ["shape"],

    process(request: Request, ctx: RenderContext): Response {
      if (isTagged(request, "shape")) {
        const shape = request as Shape;
        return processNode(
          {
            key: shape.key,
            children: shape.children,
            createNode: (ctx) => ctx.tree.createElement(shape.tag),
            applyDecorations: (node, isReused, ctx) =>
              applyDecorations(shape.decorations, node, isReused, ctx),
          },
          ctx,
        );
      }
    },
  };
}

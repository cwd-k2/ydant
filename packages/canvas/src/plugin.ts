/**
 * @ydant/canvas - Canvas plugin
 *
 * Processes "shape" spell requests using the shared processNode utility.
 * Shapes have no inline decorations — props are set via child attr() spells.
 */

import type { Plugin, Request, Response, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processNode } from "@ydant/base";
import type { Shape } from "./types";

/**
 * Creates a plugin that handles "shape" spell requests for Canvas rendering.
 *
 * This plugin delegates to the shared {@link processNode} utility,
 * creating nodes via `ctx.tree.createElement` without decorations.
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
          },
          ctx,
        );
      }
    },
  };
}

/// <reference path="./global.d.ts" />
/**
 * @ydant/portal - Plugin
 *
 * Processes portal requests by rendering children into a different target node.
 */

import type { Plugin, RenderContext, Response } from "@ydant/core";
import type { Portal } from "./types";

/** Creates a plugin that enables portal rendering. */
export function createPortalPlugin(): Plugin {
  return {
    name: "portal",
    types: ["portal"],
    dependencies: ["base"],

    process(request: Portal, ctx: RenderContext): Response {
      ctx.processChildren(request.content, { parent: request.target });
      // Clean up portal target's children when parent scope is unmounted
      ctx.unmountCallbacks.push(() => {
        ctx.tree.clearChildren(request.target);
      });
      return undefined;
    },
  };
}

/**
 * @ydant/canvas - Canvas Capability Provider
 *
 * Builds a virtual shape tree using the same capability interfaces as DOM and SSR.
 * The tree can then be painted to a Canvas2D context via paint().
 */

import type {
  Plugin,
  RenderContext,
  TreeCapability,
  DecorateCapability,
  ScheduleCapability,
} from "@ydant/core";
import type { VShape, VShapeContainer, VShapeRoot } from "./vshape";
import { paintShape } from "./paint";

/** The capabilities provided by the Canvas capability provider. */
type CanvasCapabilityNames = "tree" | "decorate" | "schedule";

/** A capability provider plugin for Canvas2D rendering. */
export interface CanvasCapabilities extends Plugin<CanvasCapabilityNames> {
  /** The virtual root node used as the mount point. */
  readonly root: VShapeRoot;
  /** Paints the rendered shape tree to a Canvas2D context. */
  paint(ctx: CanvasRenderingContext2D): void;
}

/** Creates a capability provider for Canvas2D rendering. */
export function createCanvasCapabilities(): CanvasCapabilities {
  const root: VShapeRoot = { kind: "root", children: [] };

  const tree: TreeCapability = {
    createElement(tag: string): VShape {
      return { kind: "shape", tag, props: new Map(), children: [] };
    },
    createElementNS(_ns: string, tag: string): VShape {
      return { kind: "shape", tag, props: new Map(), children: [] };
    },
    createTextNode(content: string): VShape {
      return { kind: "shape", tag: "text", props: new Map([["content", content]]), children: [] };
    },
    appendChild(parent: unknown, child: unknown): void {
      (parent as VShapeContainer).children.push(child as VShape);
    },
    removeChild(parent: unknown, child: unknown): void {
      const container = parent as VShapeContainer;
      const index = container.children.indexOf(child as VShape);
      if (index !== -1) container.children.splice(index, 1);
    },
    clearChildren(parent: unknown): void {
      (parent as VShapeContainer).children = [];
    },
  };

  const decorate: DecorateCapability = {
    setAttribute(node: unknown, key: string, value: string): void {
      (node as VShape).props.set(key, value);
    },
  };

  const schedule: ScheduleCapability = {
    scheduleCallback: (cb) => requestAnimationFrame(cb),
  };

  const isElement = (node: unknown): boolean => (node as VShape).kind === "shape";

  return {
    name: "canvas-capabilities",
    types: [],

    initContext(ctx: RenderContext) {
      ctx.tree = tree;
      ctx.decorate = decorate;
      ctx.schedule = schedule;
      ctx.currentElement = isElement(ctx.parent) ? ctx.parent : null;
    },

    beforeRender() {
      root.children = [];
    },

    paint(renderingCtx: CanvasRenderingContext2D): void {
      renderingCtx.clearRect(0, 0, renderingCtx.canvas.width, renderingCtx.canvas.height);
      for (const shape of root.children) {
        paintShape(renderingCtx, shape);
      }
    },

    get root() {
      return root;
    },
  } as CanvasCapabilities;
}

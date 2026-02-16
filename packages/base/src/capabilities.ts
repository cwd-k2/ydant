/**
 * @ydant/base - DOM Capability Provider
 *
 * Provides DOM-based implementations of the capability interfaces
 * defined in @ydant/core.
 */

import type {
  Plugin,
  RenderContext,
  TreeCapability,
  DecorateCapability,
  InteractCapability,
  ScheduleCapability,
} from "@ydant/core";

/** The capabilities provided by the DOM capability provider. */
type DOMCapabilityNames = "tree" | "decorate" | "interact" | "schedule";

export interface DOMCapabilitiesOptions {
  /** Skip clearing root content in beforeRender. Used by hydration to preserve SSR content. */
  skipPrepare?: boolean;
}

/**
 * Creates a plugin that provides DOM-based capabilities.
 *
 * Injects `tree`, `decorate`, `interact`, `schedule`, and `currentElement`
 * into every {@link RenderContext} created during rendering.
 */
export function createDOMCapabilities(
  options?: DOMCapabilitiesOptions,
): Plugin<DOMCapabilityNames> {
  const tree: TreeCapability = {
    createElement: (tag) => document.createElement(tag),
    createElementNS: (ns, tag) => document.createElementNS(ns, tag),
    createTextNode: (content) => document.createTextNode(content),
    appendChild: (parent, child) => (parent as Node).appendChild(child as Node),
    removeChild: (parent, child) => (parent as Node).removeChild(child as Node),
    clearChildren: (parent) => {
      (parent as globalThis.Element).innerHTML = "";
    },
  };

  const decorate: DecorateCapability = {
    setAttribute: (node, key, value) => (node as globalThis.Element).setAttribute(key, value),
  };

  const interact: InteractCapability = {
    addEventListener: (node, type, handler) =>
      (node as globalThis.Element).addEventListener(type, handler as EventListener),
  };

  const schedule: ScheduleCapability = {
    scheduleCallback: (cb) => requestAnimationFrame(cb),
  };

  const isElement = (node: unknown) => node instanceof globalThis.Element;

  return {
    name: "dom-capabilities",
    types: [],

    initContext(ctx: RenderContext) {
      ctx.tree = tree;
      ctx.decorate = decorate;
      ctx.interact = interact;
      ctx.schedule = schedule;
      ctx.currentElement = isElement(ctx.parent) ? ctx.parent : null;
    },

    beforeRender(ctx: RenderContext) {
      if (!options?.skipPrepare) {
        ctx.tree.clearChildren(ctx.parent);
      }
    },
  };
}

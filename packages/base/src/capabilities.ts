/**
 * @ydant/base - Capability interfaces & DOM Capability Provider
 *
 * Capabilities are the primitive operations a rendering backend provides.
 * Each capability is injected into {@link RenderContext} via plugin's
 * `initContext`, following the same module augmentation pattern used
 * by existing plugins.
 */

import type { Plugin, RenderContext } from "@ydant/core";

// =============================================================================
// Capability interfaces
// =============================================================================

/** Builds a node tree — creates nodes and assembles parent-child relationships. */
export interface TreeCapability {
  createElement(tag: string): unknown;
  createElementNS(ns: string, tag: string): unknown;
  createTextNode(content: string): unknown;
  appendChild(parent: unknown, child: unknown): void;
  removeChild(parent: unknown, child: unknown): void;
  clearChildren(parent: unknown): void;
}

/** Decorates nodes with attributes. */
export interface DecorateCapability {
  setAttribute(node: unknown, key: string, value: string): void;
}

/** Responds to external input by attaching event handlers. */
export interface InteractCapability {
  addEventListener(node: unknown, type: string, handler: (e: unknown) => void): void;
}

/** Schedules deferred callbacks (e.g., mount hooks). */
export interface ScheduleCapability {
  scheduleCallback(callback: () => void): void;
}

// =============================================================================
// DOM Capability Provider
// =============================================================================

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
export function createDOMCapabilities(options?: DOMCapabilitiesOptions): Plugin {
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

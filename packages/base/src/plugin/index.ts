/**
 * @ydant/base - Base plugin
 */

import type { Instruction, Plugin, RenderAPI, ProcessResult, RenderContext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processElement } from "./element";
import { processAttribute, processListener, processText, processLifecycle } from "./primitives";
import type { KeyedNode } from "../types";

/**
 * Executes pending mount callbacks on the next animation frame.
 * If a mount callback returns a cleanup function, it is added to unmountCallbacks.
 */
function executeMount(ctx: RenderContext): void {
  const mountCallbacks = ctx.mountCallbacks;
  const unmountCallbacks = ctx.unmountCallbacks;

  requestAnimationFrame(() => {
    for (const callback of mountCallbacks) {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        unmountCallbacks.push(cleanup);
      }
    }
    ctx.mountCallbacks = [];
  });
}

/**
 * Creates the base plugin that handles core DOM operations:
 * element creation, text nodes, attributes, event listeners, and lifecycle hooks.
 */
export function createBasePlugin(): Plugin {
  return {
    name: "base",
    types: ["element", "text", "attribute", "listener", "lifecycle"],

    initContext(ctx: RenderContext) {
      ctx.isCurrentElementReused = false;
      ctx.keyedNodes = new Map();
      ctx.mountCallbacks = [];
      ctx.unmountCallbacks = [];
    },

    mergeChildContext(parentCtx: RenderContext, childCtx: RenderContext) {
      const parentMount = parentCtx.mountCallbacks;
      const childMount = childCtx.mountCallbacks;
      const parentUnmount = parentCtx.unmountCallbacks;
      const childUnmount = childCtx.unmountCallbacks;
      if (parentMount && childMount) {
        parentMount.push(...childMount);
      }
      if (parentUnmount && childUnmount) {
        parentUnmount.push(...childUnmount);
      }
    },

    extendAPI(api: Partial<RenderAPI>, ctx: RenderContext) {
      // DOM manipulation
      Object.defineProperty(api, "isCurrentElementReused", {
        get() {
          return ctx.isCurrentElementReused;
        },
        enumerable: true,
      });
      api.appendChild = (node: Node) => {
        (ctx.parent as Node).appendChild(node);
      };
      api.setCurrentElement = (element: globalThis.Element | null) => {
        ctx.currentElement = element;
      };
      api.setParent = (parent: Node) => {
        ctx.parent = parent;
      };
      api.setCurrentElementReused = (reused: boolean) => {
        ctx.isCurrentElementReused = reused;
      };

      // Keyed element management
      const keyedNodes = ctx.keyedNodes;
      api.getKeyedNode = (key: string | number) => keyedNodes.get(key);
      api.setKeyedNode = (key: string | number, node: KeyedNode) => {
        keyedNodes.set(key, node);
      };
      api.deleteKeyedNode = (key: string | number) => {
        keyedNodes.delete(key);
      };

      // Lifecycle management
      const mountCallbacks = ctx.mountCallbacks;
      const unmountCallbacks = ctx.unmountCallbacks;

      api.onMount = (callback: () => void | (() => void)) => {
        mountCallbacks.push(callback);
      };
      api.onUnmount = (callback: () => void) => {
        unmountCallbacks.push(callback);
      };
      api.addUnmountCallbacks = (...callbacks: Array<() => void>) => {
        unmountCallbacks.push(...callbacks);
      };
      api.executeMount = () => {
        executeMount(ctx);
      };
      api.getUnmountCallbacks = () => unmountCallbacks;
    },

    process(instruction: Instruction, api: RenderAPI): ProcessResult {
      if (isTagged(instruction, "element")) {
        return processElement(instruction, api);
      }
      if (isTagged(instruction, "text")) {
        return processText(instruction, api);
      }
      if (isTagged(instruction, "attribute")) {
        return processAttribute(instruction, api);
      }
      if (isTagged(instruction, "listener")) {
        return processListener(instruction, api);
      }
      if (isTagged(instruction, "lifecycle")) {
        return processLifecycle(instruction, api);
      }
      return {};
    },
  };
}

/**
 * @ydant/base - ベースプラグイン
 */

import type {
  Child,
  Plugin,
  PluginAPI,
  PluginResult,
  RenderContext,
  RenderContextCore,
  RenderContextExtension,
} from "@ydant/core";
import { isTagged } from "@ydant/core";
import { processElement } from "./element";
import { processAttribute, processListener, processText, processLifecycle } from "./primitives";
import type { KeyedNode } from "../types";

/**
 * マウントコールバックを実行
 *
 * DOM 更新完了後（requestAnimationFrame のタイミング）に実行し、
 * クリーンアップ関数が返された場合は unmountCallbacks に追加する
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
 * ベースプラグインを作成
 *
 * element, text, attribute, listener, key, lifecycle を処理するプラグイン
 */
export function createBasePlugin(): Plugin {
  return {
    name: "base",
    types: ["element", "text", "attribute", "listener", "lifecycle"],

    initContext(ctx: RenderContextCore & Partial<RenderContextExtension>) {
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

    extendAPI(api: Partial<PluginAPI>, ctx: RenderContext) {
      // DOM 操作関連
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

      // keyedNodes 関連
      const keyedNodes = ctx.keyedNodes;
      api.getKeyedNode = (key: string | number) => keyedNodes.get(key);
      api.setKeyedNode = (key: string | number, node: KeyedNode) => {
        keyedNodes.set(key, node);
      };
      api.deleteKeyedNode = (key: string | number) => {
        keyedNodes.delete(key);
      };

      // lifecycle 関連
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

    process(child: Child, api: PluginAPI): PluginResult {
      if (isTagged(child, "element")) {
        return processElement(child, api);
      }
      if (isTagged(child, "text")) {
        return processText(child, api);
      }
      if (isTagged(child, "attribute")) {
        return processAttribute(child, api);
      }
      if (isTagged(child, "listener")) {
        return processListener(child, api);
      }
      if (isTagged(child, "lifecycle")) {
        return processLifecycle(child, api);
      }
      return {};
    },
  };
}

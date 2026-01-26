/**
 * @ydant/base - ベースプラグイン
 */

// PluginAPI 拡張を確実に適用
import "../plugin-api";

import type { Child, Plugin, PluginAPI, PluginResult } from "@ydant/core";
import { processElement } from "./element";
import {
  processAttribute,
  processListener,
  processText,
  processLifecycle,
  processKey,
} from "./primitives";
import type { Element, Attribute, Listener, Text, Lifecycle, Key } from "../types";

/**
 * マウントコールバックを実行
 *
 * DOM 更新完了後（requestAnimationFrame のタイミング）に実行し、
 * クリーンアップ関数が返された場合は unmountCallbacks に追加する
 */
function executeMount(ctx: Record<string, unknown>): void {
  const mountCallbacks = ctx.mountCallbacks as Array<() => void | (() => void)>;
  const unmountCallbacks = ctx.unmountCallbacks as Array<() => void>;

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
    types: ["element", "text", "attribute", "listener", "key", "lifecycle"],

    initContext(ctx: Record<string, unknown>) {
      ctx.pendingKey = null;
      ctx.keyedNodes = new Map();
      ctx.mountCallbacks = [];
      ctx.unmountCallbacks = [];
    },

    extendAPI(api: Record<string, unknown>, ctx: Record<string, unknown>) {
      // pendingKey 関連
      Object.defineProperty(api, "pendingKey", {
        get() {
          return ctx.pendingKey;
        },
        enumerable: true,
      });
      api.setPendingKey = (key: string | number | null) => {
        ctx.pendingKey = key;
      };

      // keyedNodes 関連
      const keyedNodes = ctx.keyedNodes as Map<string | number, unknown>;
      api.getKeyedNode = (key: string | number) => keyedNodes.get(key);
      api.setKeyedNode = (key: string | number, node: unknown) => {
        keyedNodes.set(key, node);
      };
      api.deleteKeyedNode = (key: string | number) => {
        keyedNodes.delete(key);
      };

      // lifecycle 関連
      const mountCallbacks = ctx.mountCallbacks as Array<() => void | (() => void)>;
      const unmountCallbacks = ctx.unmountCallbacks as Array<() => void>;

      api.onMount = (callback: () => void | (() => void)) => {
        mountCallbacks.push(callback);
      };
      api.onUnmount = (callback: () => void) => {
        unmountCallbacks.push(callback);
      };
      api.pushUnmountCallbacks = (...callbacks: Array<() => void>) => {
        unmountCallbacks.push(...callbacks);
      };
      api.executeMount = () => {
        executeMount(ctx);
      };
    },

    process(child: Child, api: PluginAPI): PluginResult {
      const typed = child as { type: string };

      switch (typed.type) {
        case "element":
          return processElement(child as Element, api);
        case "text":
          return processText(child as Text, api);
        case "attribute":
          return processAttribute(child as Attribute, api);
        case "listener":
          return processListener(child as Listener, api);
        case "key":
          return processKey(child as Key, api);
        case "lifecycle":
          return processLifecycle(child as Lifecycle, api);
        default:
          return {};
      }
    },
  };
}

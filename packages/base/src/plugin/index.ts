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

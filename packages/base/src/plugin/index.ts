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

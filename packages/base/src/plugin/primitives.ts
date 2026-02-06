/**
 * @ydant/base - プリミティブ処理
 */

import type { PluginAPI, PluginResult } from "@ydant/core";
import type { Attribute, Listener, Text, Lifecycle } from "../types";

/** Attribute を処理 */
export function processAttribute(attr: Attribute, api: PluginAPI): PluginResult {
  const element = api.currentElement;
  if (element) {
    element.setAttribute(attr.key, attr.value);
  }
  return {};
}

/** Listener を処理 */
export function processListener(listener: Listener, api: PluginAPI): PluginResult {
  // 再利用された要素ではリスナーを再登録しない
  if (api.isCurrentElementReused) {
    return {};
  }

  const element = api.currentElement;
  if (element) {
    element.addEventListener(listener.key, listener.value);
  }
  return {};
}

/** Text を処理 */
export function processText(text: Text, api: PluginAPI): PluginResult {
  const textNode = document.createTextNode(text.content);
  api.appendChild(textNode);
  return {};
}

/** Lifecycle を処理 */
export function processLifecycle(lifecycle: Lifecycle, api: PluginAPI): PluginResult {
  // 再利用された要素ではライフサイクルコールバックを再登録しない
  if (api.isCurrentElementReused) {
    return {};
  }

  if (lifecycle.event === "mount") {
    api.onMount(lifecycle.callback);
  } else if (lifecycle.event === "unmount") {
    api.onUnmount(lifecycle.callback as () => void);
  }
  return {};
}

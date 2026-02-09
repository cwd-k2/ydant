/**
 * @ydant/base - プリミティブ処理
 */

import type { RenderAPI, ProcessResult } from "@ydant/core";
import type { Attribute, Listener, Text, Lifecycle } from "../types";

/** Attribute を処理 */
export function processAttribute(attr: Attribute, api: RenderAPI): ProcessResult {
  const element = api.currentElement;
  if (element) {
    element.setAttribute(attr.key, attr.value);
  }
  return {};
}

/** Listener を処理 */
export function processListener(listener: Listener, api: RenderAPI): ProcessResult {
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
export function processText(text: Text, api: RenderAPI): ProcessResult {
  const textNode = document.createTextNode(text.content);
  api.appendChild(textNode);
  return {};
}

/** Lifecycle を処理 */
export function processLifecycle(lifecycle: Lifecycle, api: RenderAPI): ProcessResult {
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

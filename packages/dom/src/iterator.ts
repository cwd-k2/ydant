/**
 * Child イテレータの処理
 */

import type { Element, Child, Instructor, ChildNext } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { PluginAPI } from "./plugin";
import type { RenderContext } from "./types";
import { processElement } from "./element";
import { createPluginAPIFactory } from "./context";

// 循環参照を解決するため、PluginAPI ファクトリを遅延初期化
let createPluginAPI: ((ctx: RenderContext) => PluginAPI) | null = null;

/**
 * Child イテレータを処理し、DOM に反映する
 */
export function processIterator(iter: Instructor, ctx: RenderContext): void {
  // 初回呼び出し時に PluginAPI ファクトリを初期化
  if (!createPluginAPI) {
    createPluginAPI = createPluginAPIFactory(processIterator);
  }

  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    // まずプラグインをチェック
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = ctx.plugins.get(type);

      if (plugin) {
        const api = createPluginAPI(ctx);
        const pluginResult = plugin.process(value as Child, api);
        result = iter.next(pluginResult.value as ChildNext);
        continue;
      }
    }

    // 組み込みハンドラ
    result = processBuiltinChild(value, ctx, iter);
  }
}

/**
 * 組み込みの Child タイプを処理
 */
function processBuiltinChild(
  value: Child,
  ctx: RenderContext,
  iter: Instructor,
): IteratorResult<Child> {
  if (isTagged(value, "element")) {
    const { slot } = processElement(value as Element, ctx, processIterator);
    return iter.next(slot);
  }

  if (isTagged(value, "lifecycle")) {
    processLifecycle(value, ctx);
    return iter.next();
  }

  if (isTagged(value, "attribute")) {
    processAttribute(value, ctx);
    return iter.next();
  }

  if (isTagged(value, "listener")) {
    processListener(value, ctx);
    return iter.next();
  }

  if (isTagged(value, "text")) {
    processText(value, ctx);
    return iter.next();
  }

  if (isTagged(value, "style")) {
    processStyle(value, ctx);
    return iter.next();
  }

  if (isTagged(value, "key")) {
    processKey(value, ctx);
    return iter.next();
  }

  // 未知の type はスキップ
  return iter.next();
}

/** ライフサイクルイベントを処理 */
function processLifecycle(value: Child, ctx: RenderContext): void {
  // 再利用された要素ではライフサイクルコールバックを再登録しない
  // （既存のコールバックが移行されているため）
  if (ctx.isCurrentElementReused) {
    return;
  }

  const lifecycle = value as { event: string; callback: () => void };
  if (lifecycle.event === "mount") {
    ctx.mountCallbacks.push(lifecycle.callback as () => void | (() => void));
  } else if (lifecycle.event === "unmount") {
    ctx.unmountCallbacks.push(lifecycle.callback);
  }
}

/** 属性を処理 */
function processAttribute(value: Child, ctx: RenderContext): void {
  if (ctx.currentElement) {
    const attr = value as { key: string; value: string };
    ctx.currentElement.setAttribute(attr.key, attr.value);
  }
}

/** イベントリスナーを処理 */
function processListener(value: Child, ctx: RenderContext): void {
  // 再利用された要素ではリスナーを再登録しない
  // （元のリスナーがまだ有効なため）
  if (ctx.isCurrentElementReused) {
    return;
  }

  if (ctx.currentElement) {
    const listener = value as { key: string; value: (e: Event) => void };
    ctx.currentElement.addEventListener(listener.key, listener.value);
  }
}

/** テキストノードを処理 */
function processText(value: Child, ctx: RenderContext): void {
  const text = value as { content: string };
  const textNode = document.createTextNode(text.content);
  ctx.parent.appendChild(textNode);
}

/** インラインスタイルを処理 */
function processStyle(value: Child, ctx: RenderContext): void {
  if (ctx.currentElement && ctx.currentElement instanceof HTMLElement) {
    const style = value as { properties: Record<string, string> };
    for (const [prop, val] of Object.entries(style.properties)) {
      ctx.currentElement.style.setProperty(prop, val);
    }
  }
}

/** key を処理 */
function processKey(value: Child, ctx: RenderContext): void {
  const key = value as { value: string | number };
  ctx.pendingKey = key.value;
}

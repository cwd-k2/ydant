/**
 * @ydant/base - Element 処理
 */

import type { Builder, Instructor } from "@ydant/core";
import { isTagged } from "@ydant/core";
import type { PluginAPI, PluginResult } from "@ydant/core";
import type { Element, Slot } from "../types";

/**
 * Element を DOM ノードに変換し、Slot を返す
 */
export function processElement(element: Element, api: PluginAPI): PluginResult {
  // pending key があるか確認
  const elementKey = api.pendingKey;
  api.setPendingKey(null);

  // key があり、既存のノードが存在する場合は再利用
  let node: globalThis.Element;
  let isReused = false;

  if (elementKey !== null && api.getKeyedNode(elementKey)) {
    const existing = api.getKeyedNode(elementKey)!;
    node = existing.node;
    isReused = true;

    // 古いアンマウントコールバックを新しいコンテキストに移行
    api.pushUnmountCallbacks(...existing.unmountCallbacks);
    api.deleteKeyedNode(elementKey);
  } else {
    node = element.ns
      ? document.createElementNS(element.ns, element.tag)
      : document.createElement(element.tag);
  }

  // 親に追加（再利用時は移動になる）
  api.appendChild(node);

  // decorations (Attribute, Listener) を適用
  applyDecorations(element, node, isReused);

  // 子コンテキストの API を作成
  const childApi = api.createChildAPI(node);

  // key があれば keyedNodes に登録
  // 注意: unmountCallbacks は子コンテキストで管理されるため、後で取得する必要がある
  // ここでは一旦空の配列で登録し、後で更新する
  const unmountCallbacksRef: Array<() => void> = [];
  if (elementKey !== null) {
    api.setKeyedNode(elementKey, {
      key: elementKey,
      node,
      unmountCallbacks: unmountCallbacksRef,
    });
  }

  // Slot オブジェクトを作成
  const slot = createSlot(node, childApi, unmountCallbacksRef);

  // 子要素を処理（再利用時は子要素もクリアして再構築）
  if (isReused) {
    node.innerHTML = "";
  }

  if (element.children) {
    childApi.processChildren(() => element.children as Instructor, {
      parent: node,
    });
  }

  // 初回マウントコールバックを実行
  childApi.executeMount();

  return { value: slot };
}

/**
 * Element の decorations を DOM ノードに適用
 */
function applyDecorations(element: Element, node: globalThis.Element, isReused: boolean): void {
  if (!element.decorations) return;

  for (const decoration of element.decorations) {
    if (isTagged(decoration, "attribute")) {
      node.setAttribute(decoration.key as string, decoration.value as string);
    } else if (isTagged(decoration, "listener")) {
      // リスナーは再利用時に重複追加しないよう注意が必要
      if (!isReused) {
        node.addEventListener(decoration.key as string, decoration.value as (e: Event) => void);
      }
    }
  }
}

/**
 * Slot オブジェクトを作成
 */
function createSlot(
  node: globalThis.Element,
  childApi: PluginAPI,
  unmountCallbacksRef: Array<() => void>,
): Slot {
  return {
    node: node as HTMLElement,
    refresh(builder: Builder) {
      // unmountCallbacksRef をクリア
      for (const callback of unmountCallbacksRef) {
        callback();
      }
      unmountCallbacksRef.length = 0;

      // すべての子要素を削除
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      // 新しい子要素を処理
      childApi.processChildren(builder, { parent: node });

      // マウントコールバックを実行
      childApi.executeMount();
    },
  };
}

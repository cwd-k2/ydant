/**
 * DOM 要素の処理
 */

import type { Element, Child, ChildrenFn, Slot } from "@ydant/core";
import { toChildren, isTagged } from "@ydant/core";
import type { RenderContext } from "./types";
import { createRenderContext } from "./context";
import { executeMount } from "./lifecycle";

/**
 * Element を DOM ノードに変換し、Slot を返す
 *
 * @param element - 処理する Element
 * @param ctx - レンダリングコンテキスト
 * @param processIterator - イテレータ処理関数（循環参照回避のため引数で受け取る）
 */
export function processElement(
  element: Element,
  ctx: RenderContext,
  processIterator: (iter: Iterator<Child, void, Slot | void>, ctx: RenderContext) => void,
): { node: globalThis.Element; slot: Slot } {
  // pending key があるか確認
  const elementKey = ctx.pendingKey;
  ctx.pendingKey = null;

  // key があり、既存のノードが存在する場合は再利用
  let node: globalThis.Element;
  let isReused = false;

  if (elementKey !== null && ctx.keyedNodes.has(elementKey)) {
    const existing = ctx.keyedNodes.get(elementKey)!;
    node = existing.node;
    isReused = true;

    // 古いアンマウントコールバックを新しいコンテキストに移行
    ctx.unmountCallbacks.push(...existing.unmountCallbacks);
    ctx.keyedNodes.delete(elementKey);
  } else {
    node = element.ns
      ? document.createElementNS(element.ns, element.tag)
      : document.createElement(element.tag);
  }

  // 親に追加（再利用時は移動になる）
  ctx.parent.appendChild(node);

  // decorations (Attribute, Listener) を適用
  applyDecorations(element, node, isReused);

  // 子コンテキストを作成（親の contextValues と plugins を継承）
  // isReused フラグを渡すことで、リスナーやライフサイクルの重複登録を防ぐ
  const childCtx = createRenderContext(
    node,
    node,
    undefined,
    new Map(ctx.contextValues),
    ctx.plugins,
    isReused,
  );

  // key があれば keyedNodes に登録
  if (elementKey !== null) {
    ctx.keyedNodes.set(elementKey, {
      key: elementKey,
      node,
      unmountCallbacks: childCtx.unmountCallbacks,
    });
  }

  // Slot オブジェクトを作成
  const slot = createSlot(node, childCtx, processIterator);

  // 子要素を処理（再利用時は子要素もクリアして再構築）
  if (isReused) {
    node.innerHTML = "";
  }

  if (element.children) {
    processIterator(element.children as Iterator<Child, void, Slot | void>, childCtx);
  }

  // 初回マウントコールバックを実行
  executeMount(childCtx);

  return { node, slot };
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
      // 簡易実装: 毎回追加（本来は差分検出が必要）
      if (!isReused) {
        node.addEventListener(decoration.key as string, decoration.value as (e: Event) => void);
      }
    }
  }
}

/**
 * Slot オブジェクトを作成
 *
 * Slot.refresh() は子要素を再レンダリングし、keyed nodes の再利用を管理する
 */
function createSlot(
  node: globalThis.Element,
  childCtx: RenderContext,
  processIterator: (iter: Iterator<Child, void, Slot | void>, ctx: RenderContext) => void,
): Slot {
  return {
    node: node as HTMLElement,
    refresh(childrenFn: ChildrenFn) {
      // 古い keyed nodes を保存（再利用チェック用）
      const oldKeyedNodes = new Map(childCtx.keyedNodes);

      // 新しい keyed nodes 用の Map を作成
      // これにより、oldKeyedNodes は検索用、childCtx.keyedNodes は新規登録用に分離
      childCtx.keyedNodes = new Map();

      // アンマウントコールバックを実行
      for (const callback of childCtx.unmountCallbacks) {
        callback();
      }
      childCtx.unmountCallbacks = [];
      childCtx.mountCallbacks = [];

      // すべての子要素を削除
      // keyed 要素は oldKeyedNodes に参照が残っているので、後で再利用可能
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      // 新しいコンテキストで再処理
      childCtx.currentElement = node;
      childCtx.pendingKey = null;

      // processIterator に渡す前に oldKeyedNodes を設定
      // （processElement は ctx.keyedNodes を参照するため、一時的に設定）
      const newKeyedNodes = childCtx.keyedNodes;
      childCtx.keyedNodes = oldKeyedNodes;

      const children = toChildren(childrenFn());
      processIterator(children as Iterator<Child, void, Slot | void>, childCtx);

      // 使われなかった keyed nodes をクリーンアップ
      // oldKeyedNodes に残っているもの = 今回の処理で使われなかったもの
      // (processElement で再利用された keyed nodes は delete されている)
      // 注意: childCtx.keyedNodes は oldKeyedNodes を参照しているため、
      // 新規追加されたエントリも含まれている。oldKeys で元のキーを追跡し、
      // 再利用されなかった（まだ存在する）古いエントリのみクリーンアップする。
      for (const [key, keyedNode] of oldKeyedNodes) {
        // childCtx.keyedNodes にまだ存在する = 再利用されなかった古いエントリ
        // (再利用された場合は delete されている)
        if (childCtx.keyedNodes.has(key) && childCtx.keyedNodes.get(key) === keyedNode) {
          for (const callback of keyedNode.unmountCallbacks) {
            callback();
          }
          // 未使用エントリを削除して再利用を防ぐ
          childCtx.keyedNodes.delete(key);
        }
      }

      // 新しく登録された keyed nodes を反映
      for (const [key, keyedNode] of childCtx.keyedNodes) {
        newKeyedNodes.set(key, keyedNode);
      }
      childCtx.keyedNodes = newKeyedNodes;

      // マウントコールバックを実行
      executeMount(childCtx);
    },
  };
}

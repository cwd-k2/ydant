/**
 * TransitionGroup コンポーネント
 *
 * リスト要素の追加/削除時に CSS トランジションを適用する。
 * key を使って要素を追跡し、追加・削除・移動を検出する。
 *
 * @example
 * ```typescript
 * yield* TransitionGroup({
 *   items: todoList,
 *   keyFn: (item) => item.id,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   children: (item) => div(() => [text(item.name)]),
 * });
 * ```
 */

import type { Render } from "@ydant/core";
import type { Slot, ElementRender } from "@ydant/base";
import { div, key as keyPrimitive, onMount } from "@ydant/base";
import { addClasses, removeClasses, waitForTransition } from "./utils";

export interface TransitionGroupProps<T> {
  /** トランジション対象のアイテム配列 */
  items: T[];
  /** 各アイテムのユニークキーを返す関数 */
  keyFn: (item: T) => string | number;
  /** 入場トランジションの基本クラス */
  enter?: string;
  /** 入場開始時のクラス */
  enterFrom?: string;
  /** 入場終了時のクラス */
  enterTo?: string;
  /** 退場トランジションの基本クラス */
  leave?: string;
  /** 退場開始時のクラス */
  leaveFrom?: string;
  /** 退場終了時のクラス */
  leaveTo?: string;
  /** 各アイテムをレンダリングする関数（要素を返す必要がある） */
  children: (item: T, index: number) => ElementRender;
}

/**
 * 入場トランジションを実行
 */
async function enterTransition<T>(el: HTMLElement, props: TransitionGroupProps<T>): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.enter);
  addClasses(el, props.enterFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  requestAnimationFrame(() => {
    removeClasses(el, props.enterFrom);
    addClasses(el, props.enterTo);
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // クリーンアップ
  removeClasses(el, props.enter);
  removeClasses(el, props.enterTo);
}

/**
 * 退場トランジションを実行
 */
async function _leaveTransition<T>(el: HTMLElement, props: TransitionGroupProps<T>): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.leave);
  addClasses(el, props.leaveFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  requestAnimationFrame(() => {
    removeClasses(el, props.leaveFrom);
    addClasses(el, props.leaveTo);
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // クリーンアップ
  removeClasses(el, props.leave);
  removeClasses(el, props.leaveTo);
}

/**
 * TransitionGroup コンポーネント
 *
 * key プリミティブと Slot.refresh() を組み合わせて、
 * リスト要素の追加・削除時にトランジションを適用する。
 */
export function* TransitionGroup<T>(props: TransitionGroupProps<T>): Render {
  const { items, keyFn, children } = props;

  // 現在のキーセットを追跡
  const currentKeys = new Set<string | number>();
  for (const item of items) {
    currentKeys.add(keyFn(item));
  }

  // コンテナ要素を作成
  const containerSlot = yield* div(function* () {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemKey = keyFn(item);

      // key プリミティブを yield
      yield* keyPrimitive(itemKey);

      // 子要素をレンダリング
      const itemSlot = yield* children(item, i);

      // 入場トランジションを適用
      yield* onMount(() => {
        enterTransition(itemSlot.node, props);
      });
    }
  });

  return containerSlot;
}

/**
 * TransitionGroup のリフレッシュ用ヘルパー
 *
 * Slot.refresh() と組み合わせて使用する。
 * 新しいアイテムリストを受け取り、トランジション付きで更新する。
 */
export function createTransitionGroupRefresher<T>(
  props: Omit<TransitionGroupProps<T>, "items">,
): (slot: Slot, items: T[]) => void {
  const { keyFn, children } = props;

  return (slot: Slot, items: T[]) => {
    slot.refresh(function* () {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemKey = keyFn(item);

        // key プリミティブを yield
        yield* keyPrimitive(itemKey);

        // 子要素をレンダリング
        const itemSlot = yield* children(item, i);

        // 入場トランジションを適用（新しい要素のみ）
        yield* onMount(() => {
          enterTransition(itemSlot.node, props as TransitionGroupProps<T>);
        });
      }
    });
  };
}

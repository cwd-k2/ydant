/**
 * Transition コンポーネント
 *
 * 要素の表示/非表示時に CSS トランジションを適用する。
 *
 * @example
 * ```typescript
 * yield* Transition({
 *   show: isVisible,
 *   enter: "transition-opacity duration-300",
 *   enterFrom: "opacity-0",
 *   enterTo: "opacity-100",
 *   leave: "transition-opacity duration-300",
 *   leaveFrom: "opacity-100",
 *   leaveTo: "opacity-0",
 *   children: () => div(() => [text("Content")]),
 * });
 * ```
 */

import type { Builder, ChildContent, Render } from "@ydant/core";
import type { Slot, Element } from "@ydant/base";
import { div, onMount } from "@ydant/base";
import { addClasses, removeClasses, waitForTransition } from "./utils";

export interface TransitionProps {
  /** 要素を表示するかどうか */
  show: boolean;
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
  /** トランジション対象の子要素 */
  children: () => ChildContent;
}

/**
 * 入場トランジションを実行
 */
export async function enterTransition(el: HTMLElement, props: TransitionProps): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.enter);
  addClasses(el, props.enterFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      addClasses(el, props.enterTo);
      removeClasses(el, props.enterFrom);
      resolve();
    });
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
export async function leaveTransition(el: HTMLElement, props: TransitionProps): Promise<void> {
  // 初期状態を設定
  addClasses(el, props.leave);
  addClasses(el, props.leaveFrom);

  // 強制リフロー
  void el.offsetHeight;

  // 次のフレームでトランジションを開始
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      addClasses(el, props.leaveTo);
      removeClasses(el, props.leaveFrom);
      resolve();
    });
  });

  // トランジション終了を待つ
  await waitForTransition(el);

  // クリーンアップ
  removeClasses(el, props.leave);
  removeClasses(el, props.leaveTo);
}

// 状態を保持するための WeakMap
const transitionStates = new WeakMap<
  HTMLElement,
  {
    isShowing: boolean;
    isAnimating: boolean;
    childSlot: Slot | null;
  }
>();

/**
 * Transition コンポーネント
 *
 * show の変化に応じて enter アニメーションを実行する。
 *
 * 注意: 現在の実装では enter アニメーションのみサポート。
 * leave アニメーションが必要な場合は `createTransition` を使用すること。
 *
 * @see createTransition - leave アニメーションをサポートする代替 API
 */
export function Transition(props: TransitionProps): Render {
  const { show, children } = props;

  return div(function* () {
    // コンテナ div を作成（常に存在）
    const containerSlot = yield* div(function* () {
      // show=true の場合のみ子要素を描画
      if (show) {
        yield* children();
      }
    });

    yield* onMount(() => {
      const container = containerSlot.node;

      // 状態を取得または初期化
      let state = transitionStates.get(container);
      if (!state) {
        state = {
          isShowing: false,
          isAnimating: false,
          childSlot: null,
        };
        transitionStates.set(container, state);
      }

      const child = container.firstElementChild as HTMLElement | null;

      if (show && !state.isShowing) {
        // 入場: false → true
        state.isShowing = true;
        if (child) {
          enterTransition(child, props);
        }
      } else if (!show && state.isShowing && !state.isAnimating) {
        // 退場: true → false
        // 子要素が既に削除されている（refresh で消えた）ので、
        // 一旦復元してアニメーションを実行する必要がある
        // これは現在のアーキテクチャでは困難なため、
        // 代わりに display: none で非表示にするアプローチを取る
        state.isShowing = false;
      }

      // クリーンアップ
      return () => {
        transitionStates.delete(container);
      };
    });
  });
}

/**
 * 状態管理付き Transition コンポーネント
 *
 * leave アニメーションをサポートするために、
 * 専用の refresh 関数を提供する。
 */
export interface TransitionHandle {
  /** Transition の Slot */
  slot: Slot;
  /** show 状態を更新（アニメーション付き） */
  setShow: (show: boolean) => Promise<void>;
}

/** createTransition の戻り値型。yield* で使用し、TransitionHandle を返す。 */
export type TransitionInstruction = Generator<Element, TransitionHandle, Slot>;

/**
 * 状態管理付き Transition を作成
 *
 * @example
 * ```typescript
 * const transition = yield* createTransition({
 *   enter: "fade-enter",
 *   enterFrom: "fade-enter-from",
 *   enterTo: "fade-enter-to",
 *   leave: "fade-leave",
 *   leaveFrom: "fade-leave-from",
 *   leaveTo: "fade-leave-to",
 *   children: () => div(() => [text("Content")]),
 * });
 *
 * // Show with animation
 * await transition.setShow(true);
 *
 * // Hide with animation
 * await transition.setShow(false);
 * ```
 */
export function* createTransition(props: Omit<TransitionProps, "show">): TransitionInstruction {
  const { children } = props;

  let isShowing = false;
  let isAnimating = false;

  const renderContent: Builder = function* () {
    if (isShowing) {
      yield* children();
    }
  };

  const containerSlot: Slot = yield* div(renderContent);

  const setShow = async (show: boolean): Promise<void> => {
    if (show === isShowing || isAnimating) {
      return;
    }

    isAnimating = true;

    if (show) {
      // Enter
      isShowing = true;
      containerSlot.refresh(renderContent);

      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await enterTransition(child, props as TransitionProps);
      }
    } else {
      // Leave
      const child = containerSlot.node.firstElementChild as HTMLElement | null;
      if (child) {
        await leaveTransition(child, props as TransitionProps);
      }

      isShowing = false;
      containerSlot.refresh(renderContent);
    }

    isAnimating = false;
  };

  return {
    slot: containerSlot,
    setShow,
  };
}

/**
 * @ydant/base - SlotRef ヘルパー
 */

import type { Builder } from "@ydant/core";
import type { Slot } from "./types";

/**
 * Slot への参照を保持するオブジェクト
 *
 * イベントハンドラ等から Slot を操作するためのヘルパー。
 * bind() で Slot を関連付け、refresh() で子要素を再レンダリングする。
 */
export interface SlotRef {
  /** 現在バインドされている Slot（未バインドなら null） */
  readonly current: Slot | null;
  /** Slot をバインドする */
  bind(slot: Slot): void;
  /** バインドされた Slot の子要素を再レンダリングする */
  refresh(children: Builder): void;
  /** バインドされた Slot の DOM 要素（未バインドなら null） */
  readonly node: HTMLElement | null;
}

/**
 * SlotRef を作成する
 *
 * @example
 * ```typescript
 * const counter = createSlotRef();
 * let count = 0;
 *
 * counter.bind(yield* div(function* () {
 *   yield* text(`Count: ${count}`);
 *   yield* button(function* () {
 *     yield* on("click", () => {
 *       count++;
 *       counter.refresh(() => [text(`Count: ${count}`)]);
 *     });
 *     yield* text("Increment");
 *   });
 * }));
 * ```
 */
export function createSlotRef(): SlotRef {
  let _current: Slot | null = null;

  return {
    get current() {
      return _current;
    },
    bind(slot: Slot) {
      _current = slot;
    },
    refresh(children: Builder) {
      if (_current) {
        _current.refresh(children);
      }
    },
    get node() {
      return _current?.node ?? null;
    },
  };
}

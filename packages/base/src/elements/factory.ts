/**
 * @ydant/base - 要素ファクトリ
 */

// PluginChildExtensions の型拡張を適用
import "../plugin-api";

import type { Builder } from "@ydant/core";
import { toChildren } from "@ydant/core";
import type { Element, ElementRender, Slot } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * HTML 要素ファクトリを作成
 *
 * @returns ElementRender を返すジェネレーター関数
 *          yield* で使用すると Slot を返す
 */
export function createHTMLElement(tag: string) {
  // 注: ジェネレーターの ChildNext は void | Slot | ... だが、
  // Element を yield したときは必ず Slot が返される。
  // この型の精密化はジェネレーターの型システムの制約上困難なため、
  // 内部実装で処理し、外部には ElementRender として正しい型を公開する。
  return function* (builder: Builder): ElementRender {
    const children = toChildren(builder());
    // Element の yield は必ず Slot を返す（プラグインシステムの契約）
    return (yield { type: "element", tag, children } as Element) as Slot;
  };
}

/**
 * SVG 要素ファクトリを作成
 *
 * @returns ElementRender を返すジェネレーター関数
 *          yield* で使用すると Slot を返す
 */
export function createSVGElement(tag: string) {
  // 注: 同上
  return function* (builder: Builder): ElementRender {
    const children = toChildren(builder());
    // Element の yield は必ず Slot を返す（プラグインシステムの契約）
    return (yield { type: "element", tag, children, ns: SVG_NS } as Element) as Slot;
  };
}

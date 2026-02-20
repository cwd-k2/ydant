/**
 * @ydant/base/internals
 *
 * 拡張プラグイン作者向けの内部 API。
 * SSR hydration や Canvas plugin など、base と同レベルで動く拡張が使う。
 */

export { createSlot, executeMount, processNode } from "./plugin/element";
export type { ProcessNodeOptions } from "./plugin/element";
export { parseFactoryArgs } from "./elements/props";
export type { ParsedFactoryArgs } from "./elements/props";

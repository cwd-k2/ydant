import type { Tagged, ChildGen, Children } from "./types";

/** Tagged 型の判定関数 */
export function isTagged<T extends string>(
  value: { type: string },
  tag: T,
): value is Tagged<T, Record<string, unknown>> {
  return value.type === tag;
}

/** ChildrenFn の結果を Children に正規化する */
export function toChildren(result: Children | ChildGen[]): Children {
  if (Array.isArray(result)) {
    return (function* () {
      for (const gen of result) {
        yield* gen;
      }
    })() as Children;
  }
  return result;
}

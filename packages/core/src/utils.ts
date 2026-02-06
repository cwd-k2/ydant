import type { Tagged, Child, ChildOfType, Instruction, Instructor } from "./types";

/** Tagged 型の判定関数（Child に対する型ガード付きオーバーロード） */
export function isTagged<T extends Child["type"]>(value: Child, tag: T): value is ChildOfType<T>;
export function isTagged<T extends string>(
  value: { type: string },
  tag: T,
): value is Tagged<T, Record<string, unknown>>;
export function isTagged(value: { type: string }, tag: string): boolean {
  return value.type === tag;
}

/** Builder の結果を Instructor に正規化する */
export function toChildren(result: Instructor | Instruction[]): Instructor {
  if (Array.isArray(result)) {
    return (function* () {
      for (const instruction of result) {
        yield* instruction;
      }
    })() as Instructor;
  }
  return result;
}

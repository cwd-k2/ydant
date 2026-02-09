import type { Tagged, Child, ChildOfType, Instruction, Instructor } from "./types";

/**
 * Checks whether a tagged object matches a given type tag.
 * When called with a {@link Child}, narrows to the corresponding {@link ChildOfType}.
 */
export function isTagged<T extends Child["type"]>(value: Child, tag: T): value is ChildOfType<T>;
export function isTagged<T extends string>(
  value: { type: string },
  tag: T,
): value is Tagged<T, Record<string, unknown>>;
export function isTagged(value: { type: string }, tag: string): boolean {
  return value.type === tag;
}

/** Normalizes a {@link Builder}'s return value into a single {@link Instructor} iterator. */
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

import type { Tagged, Instruction, Render } from "./types";

/**
 * Checks whether a tagged object matches a given type tag.
 * When called with an {@link Instruction}, narrows to the matching variant.
 */
export function isTagged<T extends Instruction["type"]>(
  value: Instruction,
  tag: T,
): value is Extract<Instruction, { type: T }>;
export function isTagged<T extends string>(
  value: { type: string },
  tag: T,
): value is Tagged<T, Record<string, unknown>>;
export function isTagged(value: { type: string }, tag: string): boolean {
  return value.type === tag;
}

/** Normalizes a {@link Builder}'s return value into a single {@link Render} generator. */
export function toRender(result: Render | Render[]): Render {
  if (Array.isArray(result)) {
    return (function* () {
      for (const render of result) {
        yield* render;
      }
    })() as Render;
  }
  return result;
}

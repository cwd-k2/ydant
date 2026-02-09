// =============================================================================
// Utility Types
// =============================================================================

/** Creates a discriminated union member with a `type` tag and optional payload. */
export type Tagged<T extends string, P = {}> = { type: T } & P;

// =============================================================================
// Plugin DSLSchema Types
// =============================================================================

/**
 * Central registry of all DSL operations, extended by plugins via module augmentation.
 *
 * Each key represents a DSL operation and maps to an object with:
 * - `instruction` — the value yielded to the runtime
 * - `feedback` — the value returned from `yield` (defaults to `void`)
 * - `return` — the generator's return type (falls back to `feedback`, then `void`)
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface DSLSchema {
 *     "element": { instruction: Element; feedback: Slot };
 *     "text": { instruction: Text };
 *     "transition": { return: TransitionHandle };
 *   }
 * }
 * ```
 */
export interface DSLSchema {}

/** Extracts the `instruction` type from each entry in {@link DSLSchema}. */
type InstructionOf = {
  [K in keyof DSLSchema]: DSLSchema[K] extends { instruction: infer I } ? I : never;
};

/** Extracts the `feedback` type from each entry in {@link DSLSchema}, defaulting to `void`. */
type FeedbackOf = {
  [K in keyof DSLSchema]: DSLSchema[K] extends { feedback: infer F } ? F : void;
};

/** Extracts the `return` type from each entry in {@link DSLSchema}, falling back to `feedback` then `void`. */
type ReturnOf = {
  [K in keyof DSLSchema]: DSLSchema[K] extends { return: infer R }
    ? R
    : DSLSchema[K] extends { feedback: infer F }
      ? F
      : void;
};

/**
 * A typed generator for a single DSL operation.
 * Use with `yield*` to perform an operation and receive its feedback/return value.
 */
export type DSL<Key extends keyof DSLSchema> = Generator<
  InstructionOf[Key],
  ReturnOf[Key],
  FeedbackOf[Key]
>;

// =============================================================================
// Core Types
// =============================================================================

/** Union of all yieldable instruction values derived from {@link DSLSchema}. */
export type Instruction = InstructionOf[keyof DSLSchema];

/** Union of all feedback values that `next()` can pass back to a generator. */
export type Feedback = void | FeedbackOf[keyof DSLSchema];

// =============================================================================
// Render & Component Types
// =============================================================================

/**
 * The generator type for rendering — used by element factories, components, and children props.
 *
 * When `@ydant/base` augments {@link DSLSchema} with `Slot`, the concrete type
 * becomes `Generator<Instruction, Slot, Slot>`.
 */
export type Render = Generator<Instruction, void | ReturnOf[keyof DSLSchema], Feedback>;

/** A factory function that produces rendering instructions for an element's children. */
export type Builder = () => Render | Render[];

/**
 * A component — a function that returns a {@link Render} generator.
 *
 * - `Component` — no-arg component: `() => Render`
 * - `Component<Props>` — component with props: `(props: Props) => Render`
 *
 * @example
 * ```typescript
 * const App: Component = () => div(function* () { ... });
 *
 * interface CounterProps { initial: number }
 * const Counter: Component<CounterProps> = (props) =>
 *   div(function* () {
 *     yield* text(`Count: ${props.initial}`);
 *   });
 * ```
 */
export type Component<P = void> = [P] extends [void] ? () => Render : (props: P) => Render;

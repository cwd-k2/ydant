// =============================================================================
// Utility Types
// =============================================================================

/** Creates a discriminated union member with a `type` tag and optional payload. */
export type Tagged<T extends string, P = {}> = { type: T } & P;

/** A teardown function returned by lifecycle hooks or side effects. */
export type CleanupFn = () => void;

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

/** Union of all yieldable values derived from {@link DSLSchema}. */
export type Child = InstructionOf[keyof DSLSchema];

/** Extracts the {@link Child} variant matching a specific `type` tag. */
export type ChildOfType<T extends string> = Extract<Child, { type: T }>;

/** Union of all feedback values that `next()` can pass back to a generator. */
export type ChildNext = void | FeedbackOf[keyof DSLSchema];

/** Union of all return values a generator can produce. */
export type ChildReturn = void | ReturnOf[keyof DSLSchema];

// =============================================================================
// Generator Types
// =============================================================================

/** An iterator that yields {@link Child} values. Used internally to walk rendering instructions. */
export type Instructor = Iterator<Child, ChildReturn, ChildNext>;

/** A generator that produces rendering instructions (e.g., text, attr, on). Returned by primitives. */
export type Instruction = Generator<Child, ChildReturn, ChildNext>;

/** A factory function that produces rendering instructions for an element's children. */
export type Builder = () => Instructor | Instruction[];

/** A single-yield generator used by DSL primitives that perform a side effect and return nothing. */
export type Primitive<T extends Child> = Generator<T, void, void>;

/** The generator type for a component's `children` prop — yields any {@link Child} and returns an opaque value. */
export type ChildContent = Generator<Child, unknown, ChildNext>;

// =============================================================================
// Render & Component Types
// =============================================================================

/**
 * The generator type returned by element factories and components.
 *
 * When `@ydant/base` augments {@link DSLSchema} with `Slot`, the concrete type
 * becomes `Generator<Child, Slot, Slot>`.
 */
export type Render = Generator<Child, ChildReturn, ChildNext>;

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

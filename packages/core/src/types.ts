// =============================================================================
// Utility Types
// =============================================================================

/** Creates a discriminated union member with a `type` tag and optional payload. */
export type Tagged<T extends string, P = {}> = { type: T } & P;

// =============================================================================
// SpellSchema Types
// =============================================================================

/**
 * Central registry of all spell operations, extended by plugins via module augmentation.
 *
 * Each key represents a spell operation and maps to an object with:
 * - `request` — the value yielded to the runtime
 * - `response` — the value returned from `yield` (defaults to `void`)
 * - `return` — the generator's return type (falls back to `response`, then `void`)
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface SpellSchema {
 *     "element": { request: Element; response: Slot };
 *     "text": { request: Text };
 *     "transition": { return: TransitionHandle };
 *   }
 * }
 * ```
 */
export interface SpellSchema {}

/** Extracts the `request` type from each entry in {@link SpellSchema}. */
type RequestOf = {
  [K in keyof SpellSchema]: SpellSchema[K] extends { request: infer I } ? I : never;
};

/** Extracts the `response` type from each entry in {@link SpellSchema}, defaulting to `void`. */
type ResponseOf = {
  [K in keyof SpellSchema]: SpellSchema[K] extends { response: infer F } ? F : void;
};

/** Extracts the `return` type from each entry in {@link SpellSchema}, falling back to `response` then `void`. */
type ReturnOf = {
  [K in keyof SpellSchema]: SpellSchema[K] extends { return: infer R }
    ? R
    : SpellSchema[K] extends { response: infer F }
      ? F
      : void;
};

/**
 * A typed generator for a single spell operation.
 * Use with `yield*` to perform an operation and receive its response/return value.
 */
export type Spell<Key extends keyof SpellSchema> = Generator<
  RequestOf[Key],
  ReturnOf[Key],
  ResponseOf[Key]
>;

// =============================================================================
// Core Types
// =============================================================================

/** Union of all yieldable request values derived from {@link SpellSchema}. */
export type Request = RequestOf[keyof SpellSchema];

/** Union of all response values that `next()` can pass back to a generator. */
export type Response = void | ResponseOf[keyof SpellSchema];

// =============================================================================
// Render & Component Types
// =============================================================================

/**
 * The generator type for rendering — used by components, element factories, and content props.
 *
 * Accepts all {@link Request} types as yield values, and all
 * {@link Response} / return types registered in {@link SpellSchema}.
 */
export type Render = Generator<Request, void | ReturnOf[keyof SpellSchema], Response>;

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

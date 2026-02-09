/**
 * Context API — shares values down the component tree without prop drilling.
 *
 * Use {@link provide} to supply a value and {@link inject} to consume it.
 *
 * @example
 * ```typescript
 * const ThemeContext = createContext<"light" | "dark">("light");
 *
 * const App: Component = () =>
 *   div(function* () {
 *     yield* provide(ThemeContext, "dark");
 *     yield* ThemedButton();
 *   });
 *
 * function ThemedButton() {
 *   return button(function* () {
 *     const theme = yield* inject(ThemeContext);
 *     yield* classes(theme === "dark" ? "bg-gray-800" : "bg-white");
 *     yield* text("Click me");
 *   });
 * }
 * ```
 */

import type { Tagged, DSL } from "@ydant/core";

/** A context descriptor holding an identifier and an optional default value. */
export interface Context<T> {
  /** Unique symbol identifying this context. */
  readonly id: symbol;
  /** Value returned by {@link inject} when no provider is found. */
  readonly defaultValue: T | undefined;
}

/** A DSL instruction that provides a value to the context. */
export type ContextProvide = Tagged<
  "context-provide",
  { context: Context<unknown>; value: unknown }
>;

/** A DSL instruction that reads a value from the context. */
export type ContextInject = Tagged<"context-inject", { context: Context<unknown> }>;

/** The generator type for `inject` — yields a request and returns the resolved value. */
type Accessor<T> = Generator<ContextInject, T, T>;

/**
 * Creates a new {@link Context}.
 *
 * @param defaultValue - The fallback value used when no ancestor provides one.
 *
 * @example
 * ```typescript
 * const ThemeContext = createContext<"light" | "dark">("light");
 * const UserContext = createContext<User | null>(null);
 * ```
 */
export function createContext<T>(defaultValue?: T): Context<T> {
  return {
    id: Symbol("context"),
    defaultValue,
  };
}

/**
 * Provides a value for the given {@link Context}, making it available
 * to all descendant components via {@link inject}.
 *
 * @example
 * ```typescript
 * yield* provide(ThemeContext, "dark");
 * ```
 */
export function* provide<T>(context: Context<T>, value: T): DSL<"context-provide"> {
  yield {
    type: "context-provide",
    context: context as Context<unknown>,
    value,
  };
}

/**
 * Reads the value of a {@link Context} from the nearest ancestor provider.
 * Falls back to `defaultValue` if no provider is found.
 *
 * @returns The context value.
 *
 * @example
 * ```typescript
 * const theme = yield* inject(ThemeContext);
 * ```
 */
export function* inject<T>(context: Context<T>): Accessor<T> {
  const value = yield {
    type: "context-inject",
    context: context as Context<unknown>,
  };
  return value;
}

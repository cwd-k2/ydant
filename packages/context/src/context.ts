/**
 * Context API
 *
 * コンポーネントツリー内で値を共有するための仕組み。
 * provide で値を提供し、inject で値を取得する。
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
 *     yield* clss([theme === "dark" ? "bg-gray-800" : "bg-white"]);
 *     yield* text("Click me");
 *   });
 * }
 * ```
 */

/** Context オブジェクト */
export interface Context<T> {
  /** Context の一意な識別子 */
  readonly id: symbol;
  /** デフォルト値 */
  readonly defaultValue: T | undefined;
}

/** Context Provider 型（Tagged Union） */
export interface ContextProvide {
  type: "context-provide";
  context: Context<unknown>;
  value: unknown;
}

/** Context Inject 型（Tagged Union） */
export interface ContextInject {
  type: "context-inject";
  context: Context<unknown>;
}

/**
 * Context を作成する
 *
 * @param defaultValue - inject 時に provider が見つからない場合に使用される値
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
 * Context に値を提供する
 *
 * このジェネレーターを yield* すると、その子孫コンポーネントで
 * inject() を使ってこの値を取得できるようになる。
 *
 * @param context - 提供する Context
 * @param value - 提供する値
 *
 * @example
 * ```typescript
 * yield* provide(ThemeContext, "dark");
 * ```
 */
export function* provide<T>(
  context: Context<T>,
  value: T
): Generator<ContextProvide, void, void> {
  yield {
    type: "context-provide",
    context: context as Context<unknown>,
    value,
  };
}

/**
 * Context から値を取得する
 *
 * 親コンポーネントで provide された値を取得する。
 * provider が見つからない場合は defaultValue を返す。
 *
 * @param context - 取得する Context
 * @returns Context の値
 *
 * @example
 * ```typescript
 * const theme = yield* inject(ThemeContext);
 * ```
 */
export function* inject<T>(
  context: Context<T>
): Generator<ContextInject, T, T> {
  const value = yield {
    type: "context-inject",
    context: context as Context<unknown>,
  };
  return value;
}

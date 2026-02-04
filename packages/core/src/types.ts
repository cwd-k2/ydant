// =============================================================================
// Utility Types
// =============================================================================

/** Tagged Union を作成するヘルパー型 */
export type Tagged<T extends string, P = {}> = { type: T } & P;

// =============================================================================
// Plugin Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、独自の型を追加できる。
// =============================================================================

/**
 * プラグインが Child 型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で Element 型を追加
 * declare module "@ydant/core" {
 *   interface PluginChildExtensions {
 *     Element: Tagged<"element", { tag: string; children: Instructor }>;
 *   }
 * }
 * ```
 */
export interface PluginChildExtensions {}

/**
 * プラグインが next() に渡す値の型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で Slot を追加
 * declare module "@ydant/core" {
 *   interface PluginNextExtensions {
 *     Slot: Slot;
 *   }
 * }
 * ```
 */
export interface PluginNextExtensions {}

/**
 * プラグインが return で返す値の型を拡張するためのインターフェース
 *
 * @example
 * ```typescript
 * // @ydant/base で Slot を追加
 * declare module "@ydant/core" {
 *   interface PluginReturnExtensions {
 *     Slot: Slot;
 *   }
 * }
 * ```
 */
export interface PluginReturnExtensions {}

// =============================================================================
// Core Types (基盤型のみ)
// =============================================================================

/** 子要素として yield できるもの（プラグインによって拡張可能） */
export type Child = PluginChildExtensions[keyof PluginChildExtensions];

/** Child から特定の type を抽出するヘルパー型 */
export type ChildOfType<T extends string> = Extract<Child, { type: T }>;

/** next() に渡される値の型（プラグインによって拡張可能） */
export type ChildNext = void | PluginNextExtensions[keyof PluginNextExtensions];

/** return で返される値の型（プラグインによって拡張可能） */
export type ChildReturn = void | PluginReturnExtensions[keyof PluginReturnExtensions];

// =============================================================================
// Generator Types
// =============================================================================

/** レンダリング命令の Iterator（内部処理用） */
export type Instructor = Iterator<Child, ChildReturn, ChildNext>;

/** レンダリング命令（text, attr, on 等）の戻り値型 */
export type Instruction = Generator<Child, ChildReturn, ChildNext>;

/** 要素ファクトリ（div, span 等）の引数型 */
export type Builder = () => Instructor | Instruction[];

// =============================================================================
// Render & Component Types (基底型)
// =============================================================================

/**
 * Element を yield し、最終的に ChildReturn を返すジェネレーター
 *
 * base パッケージでは Slot が PluginReturnExtensions に追加されるため、
 * より具体的な型 (Generator<Child, Slot, Slot>) として使用される
 */
export type Render = Generator<Child, ChildReturn, ChildNext>;

/**
 * コンポーネント型
 *
 * - `Component` — 引数なし `() => Render`
 * - `Component<Props>` — Props を受け取る `(props: Props) => Render`
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

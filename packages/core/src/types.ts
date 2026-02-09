// =============================================================================
// Utility Types
// =============================================================================

/** Tagged Union を作成するヘルパー型 */
export type Tagged<T extends string, P = {}> = { type: T } & P;

/** ライフサイクルや副作用のクリーンアップ関数 */
export type CleanupFn = () => void;

// =============================================================================
// Plugin Extension Types
// -----------------------------------------------------------------------------
// プラグインは declare module "@ydant/core" を使って以下のインターフェースを
// 拡張することで、独自の型を追加できる。
// =============================================================================

/**
 * DSL 操作ごとに instruction, feedback, return を co-locate する拡張インターフェース
 *
 * - `instruction` — yield する値の型
 * - `feedback` — yield から返る値の型（省略時 void）
 * - `return` — Generator の return 値の型（省略時 feedback にフォールバック）
 *
 * @example
 * ```typescript
 * declare module "@ydant/core" {
 *   interface Extension {
 *     "element": { instruction: Element; feedback: Slot };
 *     "text": { instruction: Text };
 *     "transition": { return: TransitionHandle };
 *   }
 * }
 * ```
 */
export interface Extension {}

/** Extension の各キーから instruction 型を抽出した mapped type */
type InstructionOf = {
  [K in keyof Extension]: Extension[K] extends { instruction: infer I } ? I : never;
};

/** Extension の各キーから feedback 型を抽出した mapped type */
type FeedbackOf = {
  [K in keyof Extension]: Extension[K] extends { feedback: infer F } ? F : void;
};

/** Extension の各キーから return 型を抽出した mapped type（return → feedback → void のフォールバック） */
type ReturnOf = {
  [K in keyof Extension]: Extension[K] extends { return: infer R }
    ? R
    : Extension[K] extends { feedback: infer F }
      ? F
      : void;
};

/** DSL 操作ごとの型付きジェネレーター */
export type DSL<Key extends keyof Extension> = Generator<
  InstructionOf[Key],
  ReturnOf[Key],
  FeedbackOf[Key]
>;

// =============================================================================
// Core Types (基盤型のみ)
// =============================================================================

/** 子要素として yield できるもの（Extension から導出） */
export type Child = InstructionOf[keyof Extension];

/** Child から特定の type を抽出するヘルパー型 */
export type ChildOfType<T extends string> = Extract<Child, { type: T }>;

/** next() に渡される値の型（Extension から導出） */
export type ChildNext = void | FeedbackOf[keyof Extension];

/** return で返される値の型（Extension から導出） */
export type ChildReturn = void | ReturnOf[keyof Extension];

// =============================================================================
// Generator Types
// =============================================================================

/** レンダリング命令の Iterator（内部処理用） */
export type Instructor = Iterator<Child, ChildReturn, ChildNext>;

/** レンダリング命令（text, attr, on 等）の戻り値型 */
export type Instruction = Generator<Child, ChildReturn, ChildNext>;

/** 要素ファクトリ（div, span 等）の引数型 */
export type Builder = () => Instructor | Instruction[];

/** 副作用のみを実行する DSL プリミティブの戻り値型 */
export type Primitive<T extends Child> = Generator<T, void, void>;

/** コンポーネントの children として渡すビルダー関数の戻り値型 */
export type ChildContent = Generator<Child, unknown, ChildNext>;

// =============================================================================
// Render & Component Types (基底型)
// =============================================================================

/**
 * Element を yield し、最終的に ChildReturn を返すジェネレーター
 *
 * base パッケージでは Slot が Extension の feedback/return に含まれるため、
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

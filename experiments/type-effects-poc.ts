/**
 * PoC: yield* による Generator 型パラメータの合成
 *
 * Status: アプローチ A — ボツ案（記録として保持）
 *
 * 型レベル効果追跡は PoC 3（アプローチ C）をベースに実装済み。
 * 実装: packages/core/src/types.ts (RequiredCapabilities, CapabilityCheck 等)
 *
 * 検証項目:
 * 1. Spell<K> を yield* したとき、親 Generator の yield 型が自動推論されるか
 * 2. 複数の yield* で yield 型が union になるか
 * 3. SpellSchema の capabilities フィールドから能力要件を抽出できるか
 * 4. mount() で能力の型検証ができるか
 */

// =============================================================================
// 1. SpellSchema (能力要件付き)
// =============================================================================

interface SpellSchema {
  element: {
    request: { type: "element"; tag: string };
    response: { node: unknown };
    capabilities: "tree" | "decorate";
  };
  text: { request: { type: "text"; content: string }; response: void; capabilities: "tree" };
  listener: { request: { type: "listener"; event: string }; response: void; capabilities: "event" };
  attribute: {
    request: { type: "attribute"; key: string };
    response: void;
    capabilities: "decorate";
  };
  lifecycle: {
    request: { type: "lifecycle"; event: string };
    response: void;
    capabilities: "schedule";
  };
}

// =============================================================================
// 2. 型ユーティリティ
// =============================================================================

type RequestOf<K extends keyof SpellSchema> = SpellSchema[K]["request"];
type ResponseOf<K extends keyof SpellSchema> = SpellSchema[K] extends { response: infer R }
  ? R
  : void;
type CapabilitiesOf<K extends keyof SpellSchema> = SpellSchema[K]["capabilities"];

// 全 request/response の union (現状のアプローチ)
type AnyRequest = RequestOf<keyof SpellSchema>;
type AnyResponse = ResponseOf<keyof SpellSchema>;

// =============================================================================
// 3. Spell 型 (個別操作)
// =============================================================================

// Spell は yield で request を送り、next で response を受け取り、return で response を返す
// next の型は AnyResponse | void にして、どの文脈でも yield* できるようにする
type Spell<K extends keyof SpellSchema> = Generator<
  RequestOf<K>,
  ResponseOf<K>,
  AnyResponse | void
>;

// =============================================================================
// 4. DSL 関数
// =============================================================================

declare function element(tag: string): Spell<"element">;
declare function text(content: string): Spell<"text">;
declare function on(event: string): Spell<"listener">;
declare function attr(key: string): Spell<"attribute">;
declare function onMountHook(cb: () => void): Spell<"lifecycle">;

// =============================================================================
// 5. テスト: yield* による型推論
// =============================================================================

// --- Case A: 単一の yield* ---
function* caseA() {
  yield* text("hello");
}
type CaseA = ReturnType<typeof caseA>;
//   ^? - yield 型は何になるか?

// --- Case B: 複数の yield* (本丸) ---
function* caseB() {
  yield* element("div");
  yield* text("hello");
  yield* on("click");
}
type CaseB = ReturnType<typeof caseB>;
//   ^? - yield 型が union になるか?

// --- Case C: 返り値を使う ---
function* caseC() {
  const slot = yield* element("div");
  //    ^? - slot の型は { node: unknown } か?
  yield* text("hello");
  return slot;
}
type CaseC = ReturnType<typeof caseC>;

// --- 型の検査ヘルパー ---
type IsExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// yield 型の抽出
type YieldType<G> = G extends Generator<infer Y, unknown, unknown> ? Y : never;
type ReturnTypeOfGen<G> = G extends Generator<unknown, infer R, unknown> ? R : never;

// Case A の yield 型
type CaseA_Yield = YieldType<CaseA>;
// 期待: { type: "text"; content: string }

// Case B の yield 型
type CaseB_Yield = YieldType<CaseB>;
// 期待: { type: "element"; tag: string } | { type: "text"; content: string } | { type: "listener"; event: string }

// Case C の return 型
type CaseC_Return = ReturnTypeOfGen<CaseC>;
// 期待: { node: unknown }

// =============================================================================
// 6. yield 型から K を逆引きできるか?
// =============================================================================

// Request → K の逆引き
type KeyOfRequest<R> = {
  [K in keyof SpellSchema]: R extends RequestOf<K> ? K : never;
}[keyof SpellSchema];

// Generator の yield 型から使用されている K を抽出
type UsedSpells<G> = G extends Generator<infer Y, unknown, unknown> ? KeyOfRequest<Y> : never;

type CaseB_Spells = UsedSpells<CaseB>;
// 期待: "element" | "text" | "listener"

// =============================================================================
// 7. 能力の導出
// =============================================================================

type RequiredCapabilities<K extends keyof SpellSchema> = CapabilitiesOf<K>;

type CaseB_Capabilities = RequiredCapabilities<CaseB_Spells>;
// 期待: "tree" | "decorate" | "event"

// =============================================================================
// 8. mount の型検証 (修正版: 提供 ⊇ 要求 を検証)
// =============================================================================

// Provider が Required を満たすか検証
// 「Required が Provided の部分集合である」= Required extends Provided
interface CapabilityProvider<Provided extends string> {
  __capabilities: Provided;
}

declare function mount<K extends keyof SpellSchema>(
  app: () => Generator<RequestOf<K>, unknown, AnyResponse | void>,
  provider: RequiredCapabilities<K> extends infer R
    ? R extends string
      ? CapabilityProvider<R | (string & {})> // Provider は Required 以上を持てる
      : never
    : never,
): void;

// --- より単純なアプローチ ---
// Required ⊆ Provided を直接チェック

type Satisfies<Required extends string, Provided extends string> = Required extends Provided
  ? true
  : false;

declare function mount2<K extends keyof SpellSchema, Provided extends string>(
  app: () => Generator<RequestOf<K>, unknown, AnyResponse | void>,
  provider: CapabilityProvider<Provided>,
  // Required が Provided に含まれることを制約
  ...check: Satisfies<RequiredCapabilities<K>, Provided> extends true ? [] : [never]
): void;

// DOM は全能力を提供
declare const domProvider: CapabilityProvider<"tree" | "decorate" | "event" | "schedule">;
// SSR は tree + decorate のみ
declare const ssrProvider: CapabilityProvider<"tree" | "decorate">;

// テスト (手動注釈あり)
const AppWithEvents = function* () {
  yield* element("div");
  yield* on("click");
};

// mount2(AppWithEvents, domProvider);   // OK? (event ⊆ dom の全能力)
// mount2(AppWithEvents, ssrProvider);   // Error? (event ⊄ tree | decorate)

// =============================================================================
// 9. 代替案: Effect phantom type を Generator に付与
// =============================================================================

// Generator を拡張する branded type
type EffectfulRender<Effects extends string> = Generator<AnyRequest, void, AnyResponse | void> & {
  readonly __effects: Effects;
};

// 各 DSL 関数が effect を宣言
declare function element3(tag: string): EffectfulRender<"tree" | "decorate">;
declare function text3(content: string): EffectfulRender<"tree">;
declare function on3(event: string): EffectfulRender<"event">;

function* casePhantom() {
  yield* element3("div");
  yield* text3("hello");
  yield* on3("click");
}
type CasePhantom = ReturnType<typeof casePhantom>;
// __effects は推論されるか? → おそらく NO (structural typing で消える)

// =============================================================================
// 10. 診断用: 各型の実際の推論結果をコンパイルエラーで可視化
// =============================================================================

// これらはコンパイルエラーを意図的に出して型を確認するためのもの
// コメントアウトを外して tsc を実行する

//CaseA の yield 型を確認
const _checkA: "INSPECT" = null as unknown as CaseA_Yield;

//CaseB の yield 型を確認
const _checkB: "INSPECT" = null as unknown as CaseB_Yield;

//CaseB から逆引きした K を確認
const _checkBSpells: "INSPECT" = null as unknown as CaseB_Spells;

//CaseB の必要能力を確認
const _checkBCaps: "INSPECT" = null as unknown as CaseB_Capabilities;

//CaseC の return 型を確認
const _checkCReturn: "INSPECT" = null as unknown as CaseC_Return;

//Phantom の効果型を確認
const _checkPhantom: "INSPECT" = null as unknown as CasePhantom;

/**
 * PoC 2: yield 型逆引きと mount 検証の詳細テスト
 *
 * Status: アプローチ B — ボツ案（記録として保持）
 *
 * 型レベル効果追跡は PoC 3（アプローチ C）をベースに実装済み。
 * 実装: packages/core/src/types.ts (RequiredCapabilities, CapabilityCheck 等)
 */

// === SpellSchema ===
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
    request: { type: "lifecycle"; cb: unknown };
    response: void;
    capabilities: "schedule";
  };
}

// === 型ユーティリティ ===
type RequestOf<K extends keyof SpellSchema> = SpellSchema[K]["request"];
type ResponseOf<K extends keyof SpellSchema> = SpellSchema[K] extends { response: infer R }
  ? R
  : void;
type CapabilitiesOf<K extends keyof SpellSchema> = SpellSchema[K]["capabilities"];
type AnyResponse = ResponseOf<keyof SpellSchema>;

// === Spell ===
type Spell<K extends keyof SpellSchema> = Generator<
  RequestOf<K>,
  ResponseOf<K>,
  AnyResponse | void
>;

// === DSL ===
declare function element(tag: string): Spell<"element">;
declare function text(content: string): Spell<"text">;
declare function on(event: string): Spell<"listener">;
declare function attr(key: string): Spell<"attribute">;
declare function onMountHook(cb: () => void): Spell<"lifecycle">;

// === 逆引き: Request union → K union ===
// distributive conditional type で各 member を個別に判定
type KeyOfRequest<R> = R extends { type: infer T }
  ? T extends keyof SpellSchema
    ? T
    : never
  : never;

// === テスト: 逆引き ===
type Test1 = KeyOfRequest<{ type: "element"; tag: string }>;
// 期待: "element"

type Test2 = KeyOfRequest<
  | { type: "element"; tag: string }
  | { type: "text"; content: string }
  | { type: "listener"; event: string }
>;
// 期待: "element" | "text" | "listener"

// === Generator → capabilities の完全チェーン ===

type CapabilitiesOfGenerator<G> =
  G extends Generator<infer Y, unknown, unknown>
    ? Y extends { type: infer T }
      ? T extends keyof SpellSchema
        ? CapabilitiesOf<T>
        : never
      : never
    : never;

// --- テスト用コンポーネント ---

function* appDomOnly() {
  yield* element("div");
  yield* text("hello");
  yield* on("click");
}

function* appSsrSafe() {
  yield* element("div");
  yield* text("hello");
  yield* attr("class");
}

function* appWithLifecycle() {
  yield* element("div");
  yield* on("click");
  yield* onMountHook(() => {});
}

type AppDomOnly_Caps = CapabilitiesOfGenerator<ReturnType<typeof appDomOnly>>;
// 期待: "tree" | "decorate" | "event"

type AppSsrSafe_Caps = CapabilitiesOfGenerator<ReturnType<typeof appSsrSafe>>;
// 期待: "tree" | "decorate"

type AppWithLifecycle_Caps = CapabilitiesOfGenerator<ReturnType<typeof appWithLifecycle>>;
// 期待: "tree" | "decorate" | "event" | "schedule"

// === mount の型検証 ===

interface CapabilityProvider<C extends string> {
  readonly __brand: unique symbol;
  readonly capabilities: C;
}

// Required ⊆ Provided を検証する型
type IsSubset<Required extends string, Provided extends string> = [Required] extends [Provided]
  ? true
  : false;

// mount: Component の必要能力が Provider に含まれているか型レベルで検証
declare function mount<G extends Generator<unknown, unknown, unknown>, Provided extends string>(
  app: () => G,
  provider: CapabilityProvider<Provided>,
  // この行が型検証: 必要能力が Provided に含まれていなければ never を要求
  ..._check: IsSubset<CapabilitiesOfGenerator<G>, Provided> extends true
    ? []
    : ["ERROR: capabilities not satisfied"]
): void;

declare const domTarget: CapabilityProvider<"tree" | "decorate" | "event" | "schedule">;
declare const ssrTarget: CapabilityProvider<"tree" | "decorate">;
declare const hydrationTarget: CapabilityProvider<"event" | "schedule">;

// --- 検証 ---

// DOM に全部乗せ → OK
mount(appDomOnly, domTarget);

// SSR に SSR-safe コンポーネント → OK
mount(appSsrSafe, ssrTarget);

// SSR に event 付きコンポーネント → ERROR であるべき
// @ts-expect-error -- "event" capability is not satisfied by SSR target
mount(appDomOnly, ssrTarget);

// Hydration に lifecycle 付き → OK (event + schedule)
// ただし tree が足りないので本来 ERROR
// @ts-expect-error -- "tree" | "decorate" capabilities not satisfied
mount(appWithLifecycle, hydrationTarget);

// DOM にライフサイクル付き → OK
mount(appWithLifecycle, domTarget);

// === 診断: 各型の推論結果を可視化 ===
const _d1: "INSPECT" = null as unknown as AppDomOnly_Caps;
const _d2: "INSPECT" = null as unknown as AppSsrSafe_Caps;
const _d3: "INSPECT" = null as unknown as AppWithLifecycle_Caps;

// === 診断: mount 検証のうまくいくケースが本当に通るか ===
// (ここにエラーが出たら NG)
mount(appDomOnly, domTarget); // DOM + events → OK
mount(appSsrSafe, ssrTarget); // SSR + no events → OK
mount(appWithLifecycle, domTarget); // DOM + lifecycle → OK

/**
 * PoC 3: mount の型制約 — 正しいパターンを見つける
 */

export {};

// === Schema ===
interface SpellSchema {
  element: {
    request: { type: "element"; tag: string };
    response: { node: unknown };
    capabilities: "tree" | "decorate";
  };
  text: { request: { type: "text"; content: string }; response: void; capabilities: "tree" };
  listener: { request: { type: "listener"; event: string }; response: void; capabilities: "event" };
  lifecycle: {
    request: { type: "lifecycle"; cb: unknown };
    response: void;
    capabilities: "schedule";
  };
}

type RequestOf<K extends keyof SpellSchema> = SpellSchema[K]["request"];
type ResponseOf<K extends keyof SpellSchema> = SpellSchema[K] extends { response: infer R }
  ? R
  : void;
type CapabilitiesOf<K extends keyof SpellSchema> = SpellSchema[K]["capabilities"];
type AnyResponse = ResponseOf<keyof SpellSchema>;

type Spell<K extends keyof SpellSchema> = Generator<
  RequestOf<K>,
  ResponseOf<K>,
  AnyResponse | void
>;

declare function element(tag: string): Spell<"element">;
declare function text(content: string): Spell<"text">;
declare function on(event: string): Spell<"listener">;
declare function onMountHook(cb: () => void): Spell<"lifecycle">;

// === Generator → capabilities チェーン ===
type CapabilitiesOfGenerator<G> =
  G extends Generator<infer Y, unknown, unknown>
    ? Y extends { type: infer T }
      ? T extends keyof SpellSchema
        ? CapabilitiesOf<T>
        : never
      : never
    : never;

// === テストコンポーネント ===
function* appWithEvents() {
  yield* element("div");
  yield* text("hello");
  yield* on("click");
}

function* appSsrSafe() {
  yield* element("div");
  yield* text("hello");
}

// === mount: アプローチ A — Assert 型パラメータ ===
interface Provider<C extends string> {
  __cap: C;
}

// 「Required extends Provided」 を直接 generic constraint に
type AssertSubset<Required extends string, _Provided extends Required> = true;

// NG: generic constraint では conditional + infer が使いにくい

// === mount: アプローチ B — 型レベル assert 関数 ===
type CheckCapabilities<G, Provided extends string> =
  CapabilitiesOfGenerator<G> extends Provided
    ? void
    : {
        error: "Missing capabilities";
        required: CapabilitiesOfGenerator<G>;
        provided: Provided;
        missing: Exclude<CapabilitiesOfGenerator<G>, Provided>;
      };

declare function mount<G extends Generator, Provided extends string>(
  app: () => G,
  provider: Provider<Provided>,
): CheckCapabilities<G, Provided>;

declare const domTarget: Provider<"tree" | "decorate" | "event" | "schedule">;
declare const ssrTarget: Provider<"tree" | "decorate">;

// 型テスト: 返り値の型で検証
const _ok = mount(appWithEvents, domTarget);
//    ^? void であるべき

const _err = mount(appWithEvents, ssrTarget);
//    ^? エラー情報オブジェクトであるべき

// 診断
const _ok_check: void = _ok; // OK なら通る
// @ts-expect-error -- ssrTarget で event が足りないのでエラー型が返る
const _err_check: void = _err;

const _show_err: "INSPECT" = null as unknown as typeof _err;

// === mount: アプローチ C — 直接的な conditional constraint ===
declare function mount3<G extends Generator, Provided extends string>(
  app: () => G,
  provider: Provider<Provided> &
    (CapabilitiesOfGenerator<G> extends Provided
      ? {}
      : {
          __error: `Missing: ${Exclude<CapabilitiesOfGenerator<G>, Provided> & string}`;
        }),
): void;

mount3(appWithEvents, domTarget); // OK であるべき
mount3(appSsrSafe, ssrTarget); // OK であるべき

// @ts-expect-error -- event が足りない
mount3(appWithEvents, ssrTarget);

// === 診断: キャパビリティの推論確認 ===
type T_events = CapabilitiesOfGenerator<ReturnType<typeof appWithEvents>>;
const _show1: "INSPECT" = null as unknown as T_events;

type T_ssr = CapabilitiesOfGenerator<ReturnType<typeof appSsrSafe>>;
const _show2: "INSPECT" = null as unknown as T_ssr;

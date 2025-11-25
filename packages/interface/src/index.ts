export type Props = Record<string, unknown>;
export type Emits = Record<string, unknown[]>;
export type Slots = Record<string, Component>;

export type GetProps<C extends Component> = C extends ComponentBase<infer P, any, any> ? P : never;
export type GetEmits<C extends Component> = C extends ComponentBase<any, infer E, any> ? E : never;
export type GetSlots<C extends Component> = C extends ComponentBase<any, any, infer S> ? S : never;

export interface Build<P extends Props, E extends Emits, S extends Slots> {
  (
    useProp: <K extends keyof P>(key: K) => P[K] | undefined,
    useEmit: <K extends keyof E>(key: K) => (...args: E[K]) => void,
    useSlot: <K extends keyof S>(key: K) => S[K] | undefined
  ):
    | Iterator<Component | string, void, Reference<Component> | void>
    | Array<Iterable<Component | string>>;
}

export type Builder<C> = C extends DefineComponent<infer P, infer E, infer S>
  ? Build<P, E, S>
  : never;

interface ComponentBase<P extends Props, E extends Emits, S extends Slots> {
  readonly tag: string;
  readonly props: Partial<P>;
  readonly slots: Partial<{ [K in keyof S]: S[K] }>;
  readonly handlers: { [K in keyof E]?: (...args: E[K]) => void };
  class(cls: string[]): this;
  style(styles: Record<string, string>): this;
  children(build: Builder<S["default"]>): this;

  prop<K extends keyof P>(key: K, value: P[K]): this;
  slot<K extends keyof S>(key: K, build: Builder<S[K]>): this;
  on<K extends keyof E>(key: K, handler: (...args: E[K]) => void): this;
}

export interface NativeComponent<T extends string>
  extends ComponentBase<
    Props & { class: string[]; style: Record<string, string> },
    Record<string, [Event]>,
    { default: any }
  > {
  readonly tag: T;
  readonly isNative: true;

  [Symbol.iterator](): Iterator<this, Reference<this>, Reference<this>>;
}

export interface DefineComponent<P extends Props, E extends Emits, S extends Slots = {}>
  extends ComponentBase<P & { class: string[]; style: Record<string, string> }, E, S> {
  readonly build: Build<P, E, S>;
  readonly isNative: false;

  [Symbol.iterator](): Iterator<this, Reference<this>, Reference<this>>;
}

export type Component = NativeComponent<string> | DefineComponent<any, any, any>;

export interface Reference<C extends Component> {
  class: (cls: string[]) => this;
  style: (styles: Record<string, string>) => this;
  children: (build: Builder<GetSlots<C>["default"]>) => this;

  prop: <K extends keyof GetProps<C>>(key: K, value: GetProps<C>[K]) => this;
  slot: <K extends keyof GetSlots<C>>(key: K, build: Builder<GetSlots<C>[K]>) => this;
  on: <K extends keyof GetEmits<C>>(key: K, handler: (...args: GetEmits<C>[K]) => void) => this;

  apply(): void;
}

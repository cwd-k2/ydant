export interface Definition {
  props: Record<string, unknown>;
  emits: Record<string, unknown[]>;
  slots: Record<string, Definition>;
}

export interface Predefined extends Definition {
  props: Record<string, string>;
  emits: Record<string, [Event]>;
  slots: {};
}

export type Props<D extends Definition> = D["props"] & {
  class: string[];
  style: Record<string, string>;
};
export type Emits<D extends Definition> = D["emits"];
export type Slots<D extends Definition> = D["slots"] & {
  child: Definition;
};

export interface Build<D extends Definition> {
  (
    useProp: <K extends keyof Props<D>>(key: K) => Props<D>[K] | undefined,
    useEmit: <K extends keyof Emits<D>>(key: K) => (...args: Emits<D>[K]) => void,
    useSlot: <K extends keyof Slots<D>>(key: K) => DefineComponent<Slots<D>[K]> | undefined
  ):
    | Iterator<Component | string, void, Reference<Component> | void>
    | Array<Iterable<Component | string>>;
}

interface ComponentBase<D extends Definition> {
  readonly tag: string;
  readonly props: Partial<Props<D>>;
  readonly slots: Partial<{ [K in keyof Slots<D>]: DefineComponent<Slots<D>[K]> }>;
  readonly handlers: { [K in keyof Emits<D>]?: (...args: Emits<D>[K]) => void };

  class(cls: string[]): this;
  style(styles: Record<string, string>): this;
  child(build: Build<Slots<D>["child"]>): this;

  prop<K extends keyof Props<D>>(key: K, value: Props<D>[K]): this;
  slot<K extends keyof Slots<D>>(key: K, build: Build<Slots<D>[K]>): this;
  on<K extends keyof Emits<D>>(key: K, handler: (...args: Emits<D>[K]) => void): this;
}

export interface NativeComponent<T extends string> extends ComponentBase<Predefined> {
  readonly tag: T;
  readonly isNative: true;

  [Symbol.iterator](): Iterator<this, Reference<this>, Reference<this>>;
}

export interface DefineComponent<D extends Definition> extends ComponentBase<D> {
  readonly build: Build<D>;
  readonly isNative: false;

  [Symbol.iterator](): Iterator<this, Reference<this>, Reference<this>>;
}

export type Component = NativeComponent<string> | DefineComponent<any>;

type ExtractDefinition<C extends Component> = C extends DefineComponent<infer D> ? D : Predefined;

export interface Reference<C extends Component> {
  class: (cls: string[]) => this;
  style: (styles: Record<string, string>) => this;
  child: (build: Build<Slots<ExtractDefinition<C>>["child"]>) => this;

  prop: <K extends keyof Props<ExtractDefinition<C>>>(
    key: K,
    value: Props<ExtractDefinition<C>>[K]
  ) => this;
  slot: <K extends keyof Slots<ExtractDefinition<C>>>(
    key: K,
    build: Build<Slots<ExtractDefinition<C>>[K]>
  ) => this;
  on: <K extends keyof Emits<ExtractDefinition<C>>>(
    key: K,
    handler: (...args: Emits<ExtractDefinition<C>>[K]) => void
  ) => this;

  apply(): void;
}

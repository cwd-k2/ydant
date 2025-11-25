import type {
  Component,
  DefineComponent,
  Builder,
  Build,
  Props,
  Emits,
  Slots,
} from "@ydant/interface";

export type DefineSlots<S extends string[]> = {
  [K in S[number]]: Component;
};

type Definition = {
  props: Record<string, unknown>;
  emits: Record<string, unknown[]>;
  slots: Record<string, Component>;
};

type Pr<D extends Definition> = D["props"];
type Em<D extends Definition> = D["emits"];
type Sl<D extends Definition> = D["slots"];

export const compose =
  <D extends Definition>(tag: string, build: Build<Pr<D>, Em<D>, Sl<D>>) =>
  (): DefineComponent<Pr<D>, Em<D>, Sl<D>> =>
    new DefineComponentImpl<Pr<D>, Em<D>, Sl<D>>(tag, build);

class DefineComponentImpl<P extends Props, E extends Emits, S extends Slots>
  implements DefineComponent<P, E, S>
{
  readonly tag: string;
  readonly build: Build<P, E, S>;
  readonly props: DefineComponent<P, E, S>["props"];
  readonly slots: DefineComponent<P, E, S>["slots"];
  readonly handlers: DefineComponent<P, E, S>["handlers"];

  get isNative(): false {
    return false;
  }

  constructor(tag: string, build: Build<P, E, S>) {
    this.tag = tag;
    this.build = build;
    this.props = {};
    this.slots = {};
    this.handlers = {};
  }

  class(cls: string[]): this {
    (this.props.class as string[]) = cls;
    return this;
  }

  style(styles: Record<string, string>): this {
    (this.props.style as Record<string, string>) = styles;
    return this;
  }

  children(build: Builder<S["default"]>): this {
    return this.slot("default", build);
  }

  prop<K extends keyof P>(key: K, value: P[K]): this {
    (this.props[key] as any) = value;
    return this;
  }

  slot<K extends keyof S>(key: K, build: Builder<S[K]>): this {
    (this.slots[key] as any) = compose(`${this.tag}/${key as string}`, build)();
    return this;
  }

  on<K extends keyof E>(key: K, handler: (...args: E[K]) => void): this {
    this.handlers[key] = handler;
    return this;
  }

  *[Symbol.iterator]() {
    // @ts-expect-error
    const ref = yield this;
    return ref;
  }
}

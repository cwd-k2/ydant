import type { NativeComponent, Builder, Props, Emits, Slots } from "@ydant/interface";
import { compose } from "./composer";

export const native =
  <T extends string>(tag: T) =>
  (): NativeComponent<T> =>
    new NativeComponentImpl<T>(tag);

class NativeComponentImpl<T extends string> implements NativeComponent<T> {
  readonly tag: T;
  readonly props: NativeComponent<T>["props"];
  readonly slots: NativeComponent<T>["slots"];
  readonly handlers: NativeComponent<T>["handlers"];

  get isNative(): true {
    return true;
  }

  constructor(tag: T) {
    this.tag = tag;
    this.props = {};
    this.slots = {};
    this.handlers = {};
  }

  class(cls: string[]): this {
    this.props.class = cls;
    return this;
  }

  style(styles: Record<string, string>): this {
    this.props.style = styles;
    return this;
  }

  children(build: Builder<Slots["default"]>): this {
    return this.slot("default", build);
  }

  prop<K extends keyof Props>(key: K, value: Props[K]): this {
    this.props[key] = value;
    return this;
  }

  slot<K extends keyof Slots>(key: K, build: Builder<Slots[K]>): this {
    (this.slots as any)[key] = compose(`${this.tag}/${key as string}`, build)();
    return this;
  }

  on<K extends keyof Record<string, [Event]>>(
    key: K,
    handler: (...args: Record<string, [Event]>[K]) => void
  ): this {
    this.handlers[key] = handler;
    return this;
  }

  *[Symbol.iterator]() {
    // @ts-expect-error
    const v = yield this;
    return v;
  }
}

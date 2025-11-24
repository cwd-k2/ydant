import type { NativeComponent, Predefined, Props, Emits, Slots, Build } from "@ydant/interface";
import { compose } from "./composer";

export const native =
  <T extends string>(tag: T): (() => NativeComponent<T>) =>
  () =>
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

  child(build: Build<Slots<Predefined>["child"]>): this {
    return this.slot("child", build);
  }

  prop<K extends keyof Props<Predefined>>(key: K, value: Props<Predefined>[K]): this {
    this.props[key] = value;
    return this;
  }

  slot<K extends keyof Slots<Predefined>>(key: K, build: Build<Slots<Predefined>[K]>): this {
    this.slots[key] = compose(`${this.tag}/${key as string}`, build)();
    return this;
  }

  on<K extends keyof Emits<Predefined>>(
    key: K,
    handler: (...args: Emits<Predefined>[K]) => void
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

export const h1 = native("h1");
export const h2 = native("h2");
export const h3 = native("h3");
export const h4 = native("h4");
export const h5 = native("h5");
export const h6 = native("h6");
export const p = native("p");
export const div = native("div");
export const span = native("span");
export const button = native("button");
export const input = native("input");
export const select = native("select");
export const option = native("option");
export const textarea = native("textarea");
export const form = native("form");
export const label = native("label");
export const img = native("img");
export const ul = native("ul");

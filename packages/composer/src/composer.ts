import type { DefineComponent, Definition, Build, Props, Emits, Slots } from "@ydant/interface";

export const compose =
  <D extends Definition>(tag: string, build: Build<D>): (() => DefineComponent<D>) =>
  () =>
    new DefineComponentImpl<D>(tag, build);

class DefineComponentImpl<D extends Definition> implements DefineComponent<D> {
  readonly tag: string;
  readonly build: Build<D>;
  readonly props: DefineComponent<D>["props"];
  readonly slots: DefineComponent<D>["slots"];
  readonly handlers: DefineComponent<D>["handlers"];

  get isNative(): false {
    return false;
  }

  constructor(tag: string, build: Build<D>) {
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

  child(build: Build<Slots<D>["child"]>): this {
    return this.slot("child", build);
  }

  prop<K extends keyof Props<D>>(key: K, value: Props<D>[K]): this {
    this.props[key] = value;
    return this;
  }

  slot<K extends keyof Slots<D>>(key: K, build: Build<Slots<D>[K]>): this {
    (this.slots[key] as any) = compose(`${this.tag}/${key as string}`, build)();
    return this;
  }

  on<K extends keyof Emits<D>>(key: K, handler: (...args: Emits<D>[K]) => void): this {
    this.handlers[key] = handler;
    return this;
  }

  *[Symbol.iterator]() {
    // @ts-expect-error
    const ref = yield this;
    return ref;
  }
}

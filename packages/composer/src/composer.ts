import type {
  Sequence,
  Element,
  Decoration,
  ElementGen,
  Refresher,
  Component,
  Inject,
  Provide,
  Injector,
  Provider,
  InjectorFn,
  ProviderFn,
  Injectee,
} from "@ydant/interface";
import {
  toIterator,
  isInject,
  isProvide,
  isAttribute,
  isEventListener,
} from "@ydant/interface";

type BuildFn<T extends Record<string, unknown>> = (
  inject: InjectorFn<T>
) => Sequence<Injector<T>, ElementGen, Injectee<T>>;

type RenderFn<T extends Record<string, unknown>> = (
  provide: ProviderFn<T>
) => Sequence<Provider<T> | Decoration, void, void>;

export function compose<T extends Record<string, unknown>>(
  build: BuildFn<T>
): Component<T> {
  return ((render: RenderFn<T>): ElementGen => {
    return processComponent(build, render);
  }) as Component<T>;
}

function* processComponent<T extends Record<string, unknown>>(
  build: BuildFn<T>,
  render: RenderFn<T>
): Generator<Element, Refresher, Refresher> {
  const context: Partial<T> = {};
  const extras: Decoration[] = [];

  const inject: InjectorFn<T> = function* <K extends keyof T>(key: K) {
    const value = yield { type: "inject" as const, key } as Inject<K>;
    return value as unknown as T[K];
  };

  const provide: ProviderFn<T> = function* <K extends keyof T, V extends T[K]>(
    key: K,
    value: V
  ) {
    yield { type: "provide" as const, key, value } as Provide<K, V>;
  };

  // (1) render フェーズを先に実行: provide と装飾を収集
  const renderIter = toIterator(render(provide));
  let renderResult = renderIter.next();
  while (!renderResult.done) {
    const { value } = renderResult;
    if (isProvide(value)) {
      context[value.key as keyof T] = value.value as T[keyof T];
    } else if (isAttribute(value) || isEventListener(value)) {
      extras.push(value);
    }
    renderResult = renderIter.next();
  }

  // (2) build フェーズ: inject に context から値を渡す
  const buildIter = toIterator(build(inject));
  let buildResult = buildIter.next();
  while (!buildResult.done) {
    const { value } = buildResult;
    if (isInject(value)) {
      const key = value.key as keyof T;
      buildResult = buildIter.next(context[key] as Injectee<T>);
    }
  }

  // (3) build の return 値 (ElementGen) を処理
  const rootGen = buildResult.value as ElementGen;
  let rootResult = rootGen.next();

  // 最初の Element のみに extras を付与
  let isFirst = true;
  while (!rootResult.done) {
    const element = rootResult.value;
    const augmented: Element =
      isFirst && extras.length > 0
        ? { ...element, extras: [...(element.extras ?? []), ...extras] }
        : element;
    isFirst = false;

    const refresher: Refresher = yield augmented;
    rootResult = rootGen.next(refresher);
  }

  return rootResult.value;
}

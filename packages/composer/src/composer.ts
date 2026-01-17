import type {
  Element,
  Decoration,
  ElementGenerator,
  Refresher,
  Component,
  Inject,
  Provide,
  InjectorFn,
  ProviderFn,
  BuildFn,
  RenderFn,
} from "@ydant/interface";
import { isTagged } from "@ydant/interface";

export function compose<T extends object>(build: BuildFn<T>): Component<T> {
  return (render: RenderFn<T>): ElementGenerator => {
    return processComponent<T>(build, render);
  };
}

function* processComponent<T extends object>(
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
  const renderIter = render(provide);
  let renderResult = renderIter.next();
  while (!renderResult.done) {
    const { value } = renderResult;
    if (isTagged(value, "provide")) {
      context[value.key as keyof T] = value.value as T[keyof T];
    } else if (isTagged(value, "attribute") || isTagged(value, "listener")) {
      extras.push(value as Decoration);
    }
    renderResult = renderIter.next();
  }

  // (2) build フェーズ: inject に context から値を渡す
  const buildIter = build(inject);
  let buildResult = buildIter.next();
  while (!buildResult.done) {
    const { value } = buildResult;
    if (isTagged(value, "inject")) {
      const key = value.key as keyof T;
      buildResult = buildIter.next(context[key] as T[keyof T]);
    }
  }

  // (3) build の return 値 (ElementGenerator) を処理
  const rootGen = buildResult.value as ElementGenerator;
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

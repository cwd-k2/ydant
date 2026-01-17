import type {
  Sequence,
  Element,
  Child,
  ChildSequence,
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
import { toIterator, isInject, isProvide, isElement } from "@ydant/interface";

type BuildFn<T extends Record<string, unknown>> = (
  inject: InjectorFn<T>
) => Sequence<Injector<T>, ElementGen, Injectee<T>>;

type RenderFn<T extends Record<string, unknown>> = (
  provide: ProviderFn<T>
) => Sequence<Provider<T> | Child, void, Refresher | void>;

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

  const buildIter = toIterator(build(inject));
  const renderIter = toIterator(render(provide));

  let buildResult = buildIter.next();
  while (!buildResult.done) {
    const { value } = buildResult;
    if (isInject(value)) {
      const key = value.key as keyof T;
      buildResult = buildIter.next(context[key] as Injectee<T>);
    }
  }

  let renderResult = renderIter.next();
  while (!renderResult.done) {
    const { value } = renderResult;
    if (isProvide(value)) {
      context[value.key as keyof T] = value.value as T[keyof T];
      renderResult = renderIter.next();
    } else if (isElement(value)) {
      const refresher: Refresher = yield value;
      renderResult = renderIter.next(refresher);
    } else {
      renderResult = renderIter.next();
    }
  }

  const finalRefresher: Refresher = (childrenFn: () => ChildSequence) => {
    const newRenderIter = toIterator(childrenFn());
    let result = newRenderIter.next();
    while (!result.done) {
      result = newRenderIter.next();
    }
  };

  return finalRefresher;
}

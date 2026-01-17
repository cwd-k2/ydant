import type {
  Sequence,
  Element,
  Attribute,
  EventListener,
  Text,
  ElementGen,
  Refresher,
  Component,
} from "@ydant/interface";

type Inject<K> = { type: "inject"; key: K };

type InjectorFn<T> = <K extends keyof T>(key: K) => Generator<Inject<K>, T[K], T[K]>;

type Provide<K, V> = { type: "provide"; key: K; value: V };

type Provider<T extends Record<string, any>> = {
  [K in keyof T]: Provide<K, T[K]>;
}[keyof T];

type ProviderFn<T> = <K extends keyof T, V extends T[K]>(
  key: K,
  value: V
) => Generator<Provide<K, V>, void, void>;

type Injector<T extends Record<string, any>> = {
  [K in keyof T]: Inject<K>;
}[keyof T];

type Injectee<T extends Record<string, any>> = T[keyof T];

type BuildFn<T extends Record<string, any>> = (
  inject: InjectorFn<T>
) => Sequence<Injector<T>, ElementGen<any>, Injectee<T>>;

type RenderFn<T extends Record<string, any>> = (
  provide: ProviderFn<T>
) => Sequence<Provider<T> | Element | Attribute | EventListener | Text, void, Refresher<any> | void>;

export function compose<T extends Record<string, any>>(
  build: BuildFn<T>
): Component<T> {
  return ((render: RenderFn<T>): ElementGen<T> => {
    return processComponent(build, render);
  }) as Component<T>;
}

function* processComponent<T extends Record<string, any>>(
  build: BuildFn<T>,
  render: RenderFn<T>
): Generator<Element, Refresher<T>, Refresher<T>> {
  const context: Partial<T> = {};

  const inject: InjectorFn<T> = function* <K extends keyof T>(key: K) {
    const value = yield { type: "inject" as const, key };
    return value as unknown as T[K];
  };

  const provide: ProviderFn<T> = function* <K extends keyof T, V extends T[K]>(
    key: K,
    value: V
  ) {
    yield { type: "provide" as const, key, value };
  };

  const buildIter = toIterator(build(inject));
  const renderIter = toIterator(render(provide));

  let buildResult = buildIter.next();
  while (!buildResult.done) {
    const { value } = buildResult;
    if (value.type === "inject") {
      const key = value.key as keyof T;
      buildResult = buildIter.next(context[key] as Injectee<T>);
    }
  }

  let renderResult = renderIter.next();
  while (!renderResult.done) {
    const { value } = renderResult;
    if (value.type === "provide") {
      context[value.key as keyof T] = value.value;
      renderResult = renderIter.next();
    } else if (value.type === "element") {
      const refresher: Refresher<any> = yield value as Element;
      renderResult = renderIter.next(refresher);
    } else {
      renderResult = renderIter.next();
    }
  }

  const finalRefresher: Refresher<T> = (childrenFn) => {
    const newRenderIter = toIterator(childrenFn());
    let result = newRenderIter.next();
    while (!result.done) {
      result = newRenderIter.next();
    }
  };

  return finalRefresher;
}

function toIterator<T, TReturn, TNext>(
  seq: Sequence<T, TReturn, TNext>
): Iterator<T, TReturn, TNext> {
  if (Symbol.iterator in seq) {
    return (seq as Iterable<T, TReturn, TNext>)[Symbol.iterator]();
  }
  return seq as Iterator<T, TReturn, TNext>;
}

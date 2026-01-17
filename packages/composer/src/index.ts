export * from "./composer";
export * from "./native";
export * from "./primitives";

// Re-export types from interface
export type {
  Tagged,
  Sequence,
  Attribute,
  EventListener,
  Text,
  Child,
  ChildSequence,
  ChildrenFn,
  Element,
  ElementGen,
  Refresher,
  Inject,
  Provide,
  Injector,
  Provider,
  InjectorFn,
  ProviderFn,
  Injectee,
  Component,
  ComposeFn,
} from "@ydant/interface";

// Re-export utilities from interface
export {
  toIterator,
  isElement,
  isAttribute,
  isEventListener,
  isText,
  isInject,
  isProvide,
} from "@ydant/interface";

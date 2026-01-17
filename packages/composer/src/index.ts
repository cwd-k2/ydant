export * from "./composer";
export * from "./native";
export * from "./primitives";

// Re-export types from interface
export type {
  Tagged,
  Attribute,
  Listener,
  Text,
  Decoration,
  Child,
  ChildGen,
  Children,
  ChildrenFn,
  Element,
  ElementGenerator,
  Refresher,
  Inject,
  Provide,
  InjectorFn,
  ProviderFn,
  BuildFn,
  RenderFn,
  Component,
  App,
} from "@ydant/interface";

// Re-export utilities from interface
export { isTagged, toChildren } from "@ydant/interface";

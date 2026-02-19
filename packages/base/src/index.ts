/// <reference path="./global.d.ts" />
/**
 * @ydant/base
 *
 * 要素ファクトリ・プリミティブ DSL とそれらを処理するベースプラグイン
 */

// Types
export type {
  Slot,
  Element,
  SvgElement,
  Attribute,
  Listener,
  Text,
  Lifecycle,
  ElementProps,
  ClassValue,
  StyleValue,
  EventHandlerProps,
  HTMLElementFactory,
  SVGElementFactory,
} from "./types";

// Primitives
export { attr, classes, on, text, onMount, onUnmount, style, keyed } from "./primitives";

// HTML Elements
export {
  div,
  span,
  p,
  h1,
  h2,
  h3,
  img,
  button,
  input,
  ul,
  li,
  a,
  section,
  header,
  footer,
  nav,
  main,
  article,
  aside,
  form,
  label,
  textarea,
  select,
  option,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
} from "./elements/html";

// SVG Elements (flat exports exclude `svg` to avoid collision with namespace)
export {
  circle,
  ellipse,
  line,
  path,
  polygon,
  polyline,
  rect,
  g,
  defs,
  use,
  clipPath,
  mask,
  linearGradient,
  radialGradient,
  stop,
  svgText,
  tspan,
} from "./elements/svg";

// SlotRef
export { createSlotRef, slotRef } from "./slot-ref";
export type { SlotRef } from "./slot-ref";

// Namespace exports
import * as htmlElements from "./elements/html";
import * as svgElements from "./elements/svg";
export { htmlElements as html, svgElements as svg };

// Factory helpers
export { createHTMLElement, createSVGElement } from "./elements/factory";

// Backend
export type { DOMBackendOptions } from "./capabilities";
export { createDOMBackend } from "./capabilities";

// Plugin
export { createBasePlugin } from "./plugin/index";

// Building blocks (for extension plugins like @ydant/ssr hydration)
export { createSlot, executeMount, processNode } from "./plugin/element";
export type { ProcessNodeOptions } from "./plugin/element";

/// <reference path="./global.d.ts" />
/**
 * @ydant/base
 *
 * 要素ファクトリ・プリミティブ DSL とそれらを処理するベースプラグイン
 */

// Types
export type {
  Slot,
  ElementRender,
  Element,
  Attribute,
  Listener,
  Text,
  Lifecycle,
  Decoration,
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

// SVG Elements
export {
  svg,
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
export { createSlotRef } from "./slot-ref";
export type { SlotRef } from "./slot-ref";

// Factory helpers
export { createHTMLElement, createSVGElement } from "./elements/factory";

// Plugin
export { createBasePlugin } from "./plugin";

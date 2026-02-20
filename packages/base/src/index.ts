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
  ClassItem,
  StyleValue,
  EventHandlerProps,
  HTMLElementFactory,
  SVGElementFactory,
} from "./types";

// Primitives
export { text, onMount, onUnmount, keyed, cn } from "./primitives";

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

// Namespace exports
import * as htmlElements from "./elements/html";
import * as svgElements from "./elements/svg";
export { htmlElements as html, svgElements as svg };

// Factory helpers
export { createHTMLElement, createSVGElement } from "./elements/factory";

// Backend
export type { DOMBackendOptions, DOMCapabilityNames } from "./capabilities";
export { createDOMBackend } from "./capabilities";

// Plugin
export { createBasePlugin } from "./plugin/index";

// Slot refresh (user-facing API)
export { refresh } from "./plugin/element";

// Convenience mount
export type { MountOptions } from "./mount";
export { mount } from "./mount";

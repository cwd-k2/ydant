/**
 * @ydant/ssr - HTML serialization
 *
 * VNode ツリーを HTML 文字列に変換する。
 */

import type { VContainer, VElement, VNode, VText } from "./vnode";

/** Self-closing (void) elements that must not have a closing tag. */
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function serializeText(node: VText): string {
  return escapeText(node.content);
}

function serializeElement(node: VElement): string {
  const { tag, attributes, children } = node;

  let attrStr = "";
  for (const [key, value] of attributes) {
    attrStr += ` ${key}="${escapeAttr(value)}"`;
  }

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrStr}>`;
  }

  return `<${tag}${attrStr}>${serializeChildren(children)}</${tag}>`;
}

function serializeNode(node: VNode): string {
  return node.kind === "text" ? serializeText(node) : serializeElement(node);
}

function serializeChildren(children: VNode[]): string {
  return children.map(serializeNode).join("");
}

/** Serializes a VNode container (VRoot or VElement) to an HTML string. */
export function toHTML(container: VContainer): string {
  return serializeChildren(container.children);
}

import type {
  Element,
  Child,
  ChildrenFn,
  Component,
  Refresher,
} from "@ydant/core";
import { toChildren, isTagged } from "@ydant/core";

interface RenderContext {
  parent: Node;
  currentElement: globalThis.Element | null;
}

function processElement(
  element: Element,
  ctx: RenderContext
): { node: globalThis.Element; refresher: Refresher } {
  const node = element.ns
    ? document.createElementNS(element.ns, element.tag)
    : document.createElement(element.tag);
  ctx.parent.appendChild(node);

  // extras (Attribute, Listener, Tap) を適用
  if (element.extras) {
    for (const extra of element.extras) {
      if (isTagged(extra, "attribute")) {
        node.setAttribute(extra.key as string, extra.value as string);
      } else if (isTagged(extra, "listener")) {
        node.addEventListener(extra.key as string, extra.value as (e: Event) => void);
      } else if (isTagged(extra, "tap")) {
        (extra.callback as (el: globalThis.Element) => void)(node);
      }
    }
  }

  const childCtx: RenderContext = {
    parent: node,
    currentElement: node,
  };

  const refresher: Refresher = (childrenFn: ChildrenFn) => {
    node.innerHTML = "";
    childCtx.currentElement = node;
    const children = toChildren(childrenFn());
    processIterator(children as Iterator<Child, void, Refresher | void>, childCtx);
  };

  if (element.holds) {
    processIterator(element.holds as Iterator<Child, void, Refresher | void>, childCtx);
  }

  return { node, refresher };
}

function processIterator(
  iter: Iterator<Child, void, Refresher | void>,
  ctx: RenderContext
): void {
  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    if (isTagged(value, "element")) {
      const { refresher } = processElement(value as Element, ctx);
      result = iter.next(refresher);
    } else if (isTagged(value, "attribute")) {
      if (ctx.currentElement) {
        ctx.currentElement.setAttribute(value.key as string, value.value as string);
      }
      result = iter.next();
    } else if (isTagged(value, "listener")) {
      if (ctx.currentElement) {
        ctx.currentElement.addEventListener(value.key as string, value.value as (e: Event) => void);
      }
      result = iter.next();
    } else if (isTagged(value, "tap")) {
      if (ctx.currentElement) {
        (value.callback as (el: globalThis.Element) => void)(ctx.currentElement);
      }
      result = iter.next();
    } else if (isTagged(value, "text")) {
      const textNode = document.createTextNode(value.content as string);
      ctx.parent.appendChild(textNode);
      result = iter.next();
    } else {
      result = iter.next();
    }
  }
}

function render(gen: Component, parent: HTMLElement): void {
  parent.innerHTML = "";

  const ctx: RenderContext = {
    parent,
    currentElement: null,
  };

  let result = gen.next();

  while (!result.done) {
    const { value } = result;

    if (isTagged(value, "element")) {
      const { refresher } = processElement(value as Element, ctx);
      result = gen.next(refresher);
    } else {
      result = gen.next(undefined as unknown as Refresher);
    }
  }
}

/** Component を DOM にマウントする */
export function mount(app: Component, parent: HTMLElement): void {
  render(app, parent);
}

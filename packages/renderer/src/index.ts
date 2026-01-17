import type {
  Element,
  Child,
  ChildrenFn,
  ElementGen,
  Refresher,
} from "@ydant/interface";
import {
  toIterator,
  isElement,
  isAttribute,
  isEventListener,
  isText,
} from "@ydant/interface";

interface RenderContext {
  parent: Node;
  currentElement: HTMLElement | null;
}

function processElement(
  element: Element,
  ctx: RenderContext
): { node: HTMLElement; refresher: Refresher } {
  const node = document.createElement(element.tag);
  ctx.parent.appendChild(node);

  const childCtx: RenderContext = {
    parent: node,
    currentElement: node,
  };

  const refresher: Refresher = (childrenFn: ChildrenFn) => {
    node.innerHTML = "";
    childCtx.currentElement = node;
    const children = childrenFn();
    const iter = toIterator(children) as Iterator<Child, void, Refresher | void>;
    processIterator(iter, childCtx);
  };

  if (element.holds) {
    const childIter = toIterator(element.holds) as Iterator<Child, void, Refresher | void>;
    processIterator(childIter, childCtx);
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

    if (isElement(value)) {
      const { refresher } = processElement(value, ctx);
      result = iter.next(refresher);
    } else if (isAttribute(value)) {
      if (ctx.currentElement) {
        ctx.currentElement.setAttribute(value.key, value.value);
      }
      result = iter.next();
    } else if (isEventListener(value)) {
      if (ctx.currentElement) {
        ctx.currentElement.addEventListener(value.key, value.value);
      }
      result = iter.next();
    } else if (isText(value)) {
      const textNode = document.createTextNode(value.content);
      ctx.parent.appendChild(textNode);
      result = iter.next();
    } else {
      result = iter.next();
    }
  }
}

export function render(gen: ElementGen, parent: HTMLElement): void {
  parent.innerHTML = "";

  const ctx: RenderContext = {
    parent,
    currentElement: null,
  };

  let result = gen.next();

  while (!result.done) {
    const { value } = result;

    if (isElement(value)) {
      const { refresher } = processElement(value, ctx);
      result = gen.next(refresher);
    } else {
      result = gen.next(undefined as unknown as Refresher);
    }
  }
}

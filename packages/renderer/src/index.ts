import type {
  Sequence,
  Element,
  Attribute,
  EventListener,
  Text,
  Child,
  ElementGen,
  Refresher,
} from "@ydant/interface";

type YieldValue = Element | Attribute | EventListener | Text;

interface RenderContext {
  parent: Node;
  currentElement: HTMLElement | null;
}

function toIterator<T, TReturn, TNext>(
  seq: Sequence<T, TReturn, TNext>
): Iterator<T, TReturn, TNext> {
  if (Symbol.iterator in seq) {
    return (seq as Iterable<T, TReturn, TNext>)[Symbol.iterator]();
  }
  return seq as Iterator<T, TReturn, TNext>;
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

  const refresher: Refresher = (
    childrenFn: () => Sequence<Child, void, Refresher | void>
  ) => {
    node.innerHTML = "";
    childCtx.currentElement = node;
    const children = childrenFn();
    const iter = toIterator(children) as Iterator<YieldValue, void, Refresher | void>;
    processIterator(iter, childCtx);
  };

  if (element.holds) {
    const childIter = toIterator(element.holds) as Iterator<YieldValue, void, Refresher | void>;
    processIterator(childIter, childCtx);
  }

  return { node, refresher };
}

function processIterator(
  iter: Iterator<YieldValue, void, Refresher | void>,
  ctx: RenderContext
): void {
  let result = iter.next();

  while (!result.done) {
    const { value } = result;

    switch (value.type) {
      case "element": {
        const { refresher } = processElement(value as Element, ctx);
        result = iter.next(refresher);
        break;
      }

      case "attribute": {
        if (ctx.currentElement) {
          const attr = value as Attribute;
          ctx.currentElement.setAttribute(attr.key, attr.value);
        }
        result = iter.next();
        break;
      }

      case "eventlistener": {
        if (ctx.currentElement) {
          const listener = value as EventListener;
          ctx.currentElement.addEventListener(listener.key, listener.value);
        }
        result = iter.next();
        break;
      }

      case "text": {
        const textNode = document.createTextNode((value as Text).content);
        ctx.parent.appendChild(textNode);
        result = iter.next();
        break;
      }

      default:
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

    if (value.type === "element") {
      const { refresher } = processElement(value, ctx);
      result = gen.next(refresher);
    } else {
      // Element 以外の値が来ることは想定外だが、安全のため処理を続行
      result = gen.next(undefined as unknown as Refresher);
    }
  }
}

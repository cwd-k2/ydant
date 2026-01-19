import type {
  Element,
  Child,
  ChildrenFn,
  ElementGenerator,
  Slot,
  Component,
} from "@ydant/core";
import { toChildren, isTagged } from "@ydant/core";

interface RenderContext {
  parent: Node;
  currentElement: globalThis.Element | null;
  mountCallbacks: Array<() => void | (() => void)>;
  unmountCallbacks: Array<() => void>;
}

function createContext(
  parent: Node,
  currentElement: globalThis.Element | null
): RenderContext {
  return {
    parent,
    currentElement,
    mountCallbacks: [],
    unmountCallbacks: [],
  };
}

function executeMount(ctx: RenderContext): void {
  // DOM 更新完了後にマウントコールバックを実行
  requestAnimationFrame(() => {
    for (const callback of ctx.mountCallbacks) {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        ctx.unmountCallbacks.push(cleanup);
      }
    }
    ctx.mountCallbacks = [];
  });
}

function processElement(
  element: Element,
  ctx: RenderContext
): { node: globalThis.Element; slot: Slot } {
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
        node.addEventListener(
          extra.key as string,
          extra.value as (e: Event) => void
        );
      } else if (isTagged(extra, "tap")) {
        (extra.callback as (el: globalThis.Element) => void)(node);
      }
    }
  }

  // 子コンテキストを作成
  const childCtx = createContext(node, node);

  // Slot オブジェクトを作成
  const slot: Slot = {
    node: node as HTMLElement,
    refresh(childrenFn: ChildrenFn) {
      // アンマウントコールバックを実行
      for (const callback of childCtx.unmountCallbacks) {
        callback();
      }
      childCtx.unmountCallbacks = [];
      childCtx.mountCallbacks = [];

      // DOM をクリアして再構築
      node.innerHTML = "";
      childCtx.currentElement = node;
      const children = toChildren(childrenFn());
      processIterator(children as Iterator<Child, void, Slot | void>, childCtx);

      // マウントコールバックを実行
      executeMount(childCtx);
    },
  };

  // 子要素を処理
  if (element.holds) {
    processIterator(
      element.holds as Iterator<Child, void, Slot | void>,
      childCtx
    );
  }

  // 初回マウントコールバックを実行
  executeMount(childCtx);

  return { node, slot };
}

function processIterator(
  iter: Iterator<Child, void, Slot | void>,
  ctx: RenderContext
): void {
  let result = iter.next();

  while (!result.done) {
    const value = result.value;

    if (isTagged(value, "element")) {
      const { slot } = processElement(value as Element, ctx);
      result = iter.next(slot);
    } else if (isTagged(value, "lifecycle")) {
      // ライフサイクルイベントの処理
      if (value.event === "mount") {
        ctx.mountCallbacks.push(
          value.callback as () => void | (() => void)
        );
      } else if (value.event === "unmount") {
        ctx.unmountCallbacks.push(value.callback as () => void);
      }
      result = iter.next();
    } else if (isTagged(value, "attribute")) {
      if (ctx.currentElement) {
        ctx.currentElement.setAttribute(
          value.key as string,
          value.value as string
        );
      }
      result = iter.next();
    } else if (isTagged(value, "listener")) {
      if (ctx.currentElement) {
        ctx.currentElement.addEventListener(
          value.key as string,
          value.value as (e: Event) => void
        );
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
    } else if (isTagged(value, "style")) {
      // インラインスタイルを適用
      if (ctx.currentElement && ctx.currentElement instanceof HTMLElement) {
        const properties = value.properties as Record<string, string>;
        for (const [prop, val] of Object.entries(properties)) {
          ctx.currentElement.style.setProperty(prop, val);
        }
      }
      result = iter.next();
    } else if (isTagged(value, "key")) {
      // key はマーカーとして記録（Phase 3 で差分更新に使用予定）
      // 現時点では処理なし
      result = iter.next();
    } else {
      result = iter.next();
    }
  }
}

function render(gen: ElementGenerator, parent: HTMLElement): void {
  parent.innerHTML = "";

  const ctx = createContext(parent, null);

  let result = gen.next();

  while (!result.done) {
    const { value } = result;

    if (isTagged(value, "element")) {
      const { slot } = processElement(value as Element, ctx);
      result = gen.next(slot);
    } else {
      result = gen.next(undefined as unknown as Slot);
    }
  }
}

/** Component を DOM にマウントする */
export function mount(app: Component, parent: HTMLElement): void {
  render(app(), parent);
}

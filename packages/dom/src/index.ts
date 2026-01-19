import type {
  Element,
  Child,
  ChildrenFn,
  ElementGenerator,
  Slot,
  Component,
  Context,
} from "@ydant/core";
import { toChildren, isTagged } from "@ydant/core";
import { runWithSubscriber } from "@ydant/reactive";

/** Keyed 要素の情報 */
interface KeyedNode {
  key: string | number;
  node: globalThis.Element;
  unmountCallbacks: Array<() => void>;
}

interface RenderContext {
  parent: Node;
  currentElement: globalThis.Element | null;
  mountCallbacks: Array<() => void | (() => void)>;
  unmountCallbacks: Array<() => void>;
  /** 次の要素に関連付けるキー */
  pendingKey: string | number | null;
  /** キー付き要素のマップ */
  keyedNodes: Map<string | number, KeyedNode>;
  /** Context の値を保持するマップ */
  contextValues: Map<symbol, unknown>;
}

function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  keyedNodes?: Map<string | number, KeyedNode>,
  contextValues?: Map<symbol, unknown>
): RenderContext {
  return {
    parent,
    currentElement,
    mountCallbacks: [],
    unmountCallbacks: [],
    pendingKey: null,
    keyedNodes: keyedNodes ?? new Map(),
    contextValues: contextValues ?? new Map(),
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
  // pending key があるか確認
  const elementKey = ctx.pendingKey;
  ctx.pendingKey = null;

  // key があり、既存のノードが存在する場合は再利用
  let node: globalThis.Element;
  let isReused = false;

  if (elementKey !== null && ctx.keyedNodes.has(elementKey)) {
    const existing = ctx.keyedNodes.get(elementKey)!;
    node = existing.node;
    isReused = true;

    // 古いアンマウントコールバックを新しいコンテキストに移行
    ctx.unmountCallbacks.push(...existing.unmountCallbacks);
    ctx.keyedNodes.delete(elementKey);
  } else {
    node = element.ns
      ? document.createElementNS(element.ns, element.tag)
      : document.createElement(element.tag);
  }

  // 親に追加（再利用時は移動になる）
  ctx.parent.appendChild(node);

  // extras (Attribute, Listener, Tap) を適用
  if (element.extras) {
    for (const extra of element.extras) {
      if (isTagged(extra, "attribute")) {
        node.setAttribute(extra.key as string, extra.value as string);
      } else if (isTagged(extra, "listener")) {
        // リスナーは再利用時に重複追加しないよう注意が必要
        // 簡易実装: 毎回追加（本来は差分検出が必要）
        if (!isReused) {
          node.addEventListener(
            extra.key as string,
            extra.value as (e: Event) => void
          );
        }
      } else if (isTagged(extra, "tap")) {
        (extra.callback as (el: globalThis.Element) => void)(node);
      }
    }
  }

  // 子コンテキストを作成（親の contextValues を継承）
  const childCtx = createRenderContext(
    node,
    node,
    undefined,
    new Map(ctx.contextValues)
  );

  // key があれば keyedNodes に登録
  if (elementKey !== null) {
    ctx.keyedNodes.set(elementKey, {
      key: elementKey,
      node,
      unmountCallbacks: childCtx.unmountCallbacks,
    });
  }

  // Slot オブジェクトを作成
  const slot: Slot = {
    node: node as HTMLElement,
    refresh(childrenFn: ChildrenFn) {
      // 古い keyed nodes を保存
      const oldKeyedNodes = new Map(childCtx.keyedNodes);

      // アンマウントコールバックを実行（keyed nodes は除く）
      for (const callback of childCtx.unmountCallbacks) {
        callback();
      }
      childCtx.unmountCallbacks = [];
      childCtx.mountCallbacks = [];

      // DOM をクリア（ただし keyed nodes は一時的に退避）
      const keyedElements: globalThis.Element[] = [];
      for (const [, keyedNode] of oldKeyedNodes) {
        if (keyedNode.node.parentNode === node) {
          keyedElements.push(keyedNode.node);
        }
      }

      // keyed でない要素を削除
      while (node.firstChild) {
        const child = node.firstChild;
        if (keyedElements.includes(child as globalThis.Element)) {
          // 一時的に退避
          node.removeChild(child);
        } else {
          node.removeChild(child);
        }
      }

      // 新しいコンテキストで再処理（古い keyed nodes を渡す）
      childCtx.currentElement = node;
      childCtx.keyedNodes = oldKeyedNodes;
      childCtx.pendingKey = null;

      const children = toChildren(childrenFn());
      processIterator(children as Iterator<Child, void, Slot | void>, childCtx);

      // 使われなかった keyed nodes をクリーンアップ
      for (const [, keyedNode] of childCtx.keyedNodes) {
        // アンマウントコールバックを実行
        for (const callback of keyedNode.unmountCallbacks) {
          callback();
        }
        // DOM から削除（まだ存在していれば）
        if (keyedNode.node.parentNode) {
          keyedNode.node.parentNode.removeChild(keyedNode.node);
        }
      }
      childCtx.keyedNodes.clear();

      // マウントコールバックを実行
      executeMount(childCtx);
    },
  };

  // 子要素を処理（再利用時は子要素もクリアして再構築）
  if (isReused) {
    node.innerHTML = "";
  }

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
      // key を記録して次の要素に関連付ける
      ctx.pendingKey = value.value as string | number;
      result = iter.next();
    } else if (isTagged(value, "reactive")) {
      // リアクティブブロックの処理
      const childrenFn = value.childrenFn as ChildrenFn;

      // コンテナ要素を作成（リアクティブ更新のため）
      const container = document.createElement("span");
      container.setAttribute("data-reactive", "");
      ctx.parent.appendChild(container);

      // リアクティブコンテキスト（親の contextValues を継承）
      const reactiveCtx = createRenderContext(
        container,
        container,
        undefined,
        new Map(ctx.contextValues)
      );

      // 更新関数
      const update = () => {
        // アンマウントコールバックを実行
        for (const callback of reactiveCtx.unmountCallbacks) {
          callback();
        }
        reactiveCtx.unmountCallbacks = [];
        reactiveCtx.mountCallbacks = [];

        // DOM をクリアして再構築
        container.innerHTML = "";
        reactiveCtx.currentElement = container;

        // Signal 依存関係を追跡しながら子要素を処理
        runWithSubscriber(update, () => {
          const children = toChildren(childrenFn());
          processIterator(
            children as Iterator<Child, void, Slot | void>,
            reactiveCtx
          );
        });

        // マウントコールバックを実行
        executeMount(reactiveCtx);
      };

      // 初回レンダリング（依存関係を追跡）
      update();

      // アンマウント時にリアクティブ購読を解除するためのクリーンアップ
      ctx.unmountCallbacks.push(() => {
        for (const callback of reactiveCtx.unmountCallbacks) {
          callback();
        }
      });

      result = iter.next();
    } else if (isTagged(value, "context-provide")) {
      // Context に値を設定
      const context = value.context as Context<unknown>;
      ctx.contextValues.set(context.id, value.value);
      result = iter.next();
    } else if (isTagged(value, "context-inject")) {
      // Context から値を取得
      const context = value.context as Context<unknown>;
      const contextValue = ctx.contextValues.has(context.id)
        ? ctx.contextValues.get(context.id)
        : context.defaultValue;
      result = iter.next(contextValue as Slot | void);
    } else {
      result = iter.next();
    }
  }
}

function render(gen: ElementGenerator, parent: HTMLElement): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null);

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

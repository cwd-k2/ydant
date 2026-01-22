import type {
  Element,
  Child,
  ChildrenFn,
  Render,
  Slot,
  Component,
} from "@ydant/core";
import { toChildren, isTagged } from "@ydant/core";
import type { DomPlugin, PluginAPI, MountOptions } from "./plugin";

// Re-export plugin types
export type { DomPlugin, PluginAPI, PluginResult, MountOptions } from "./plugin";

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
  /** 登録されたプラグイン */
  plugins: Map<string, DomPlugin>;
}

function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  keyedNodes?: Map<string | number, KeyedNode>,
  contextValues?: Map<symbol, unknown>,
  plugins?: Map<string, DomPlugin>
): RenderContext {
  return {
    parent,
    currentElement,
    mountCallbacks: [],
    unmountCallbacks: [],
    pendingKey: null,
    keyedNodes: keyedNodes ?? new Map(),
    contextValues: contextValues ?? new Map(),
    plugins: plugins ?? new Map(),
  };
}

/**
 * RenderContext から PluginAPI を作成
 */
function createPluginAPI(ctx: RenderContext): PluginAPI {
  return {
    get parent() {
      return ctx.parent;
    },
    get currentElement() {
      return ctx.currentElement;
    },
    getContext<T>(id: symbol): T | undefined {
      return ctx.contextValues.get(id) as T | undefined;
    },
    setContext<T>(id: symbol, value: T): void {
      ctx.contextValues.set(id, value);
    },
    onMount(callback: () => void | (() => void)): void {
      ctx.mountCallbacks.push(callback);
    },
    onUnmount(callback: () => void): void {
      ctx.unmountCallbacks.push(callback);
    },
    appendChild(node: Node): void {
      ctx.parent.appendChild(node);
    },
    processChildren(
      childrenFn: ChildrenFn,
      options?: { parent?: Node; inheritContext?: boolean }
    ): void {
      const targetParent = options?.parent ?? ctx.parent;
      const inheritContext = options?.inheritContext ?? true;

      const childCtx = createRenderContext(
        targetParent,
        targetParent instanceof globalThis.Element ? targetParent : null,
        undefined,
        inheritContext ? new Map(ctx.contextValues) : new Map(),
        ctx.plugins
      );

      const children = toChildren(childrenFn());
      processIterator(
        children as Iterator<Child, void, Slot | void>,
        childCtx
      );

      // 子コンテキストのコールバックを親に伝搬
      ctx.mountCallbacks.push(...childCtx.mountCallbacks);
      ctx.unmountCallbacks.push(...childCtx.unmountCallbacks);
    },
    createChildAPI(parent: Node): PluginAPI {
      const childCtx = createRenderContext(
        parent,
        parent instanceof globalThis.Element ? parent : null,
        undefined,
        new Map(ctx.contextValues),
        ctx.plugins
      );
      return createPluginAPI(childCtx);
    },
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

  // decorations (Attribute, Listener) を適用
  if (element.decorations) {
    for (const extra of element.decorations) {
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
      }
    }
  }

  // 子コンテキストを作成（親の contextValues と plugins を継承）
  const childCtx = createRenderContext(
    node,
    node,
    undefined,
    new Map(ctx.contextValues),
    ctx.plugins
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

      // すべての子要素を削除
      // keyed 要素は Map に参照が残っているので、後で再利用可能
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      // 新しいコンテキストで再処理（古い keyed nodes を渡す）
      childCtx.currentElement = node;
      childCtx.keyedNodes = oldKeyedNodes;
      childCtx.pendingKey = null;

      const children = toChildren(childrenFn());
      processIterator(children as Iterator<Child, void, Slot | void>, childCtx);

      // 使われなかった keyed nodes をクリーンアップ
      // oldKeyedNodes に残っているもの = 今回の処理で使われなかったもの
      // (processElement で再利用された keyed nodes は delete されている)
      for (const [, keyedNode] of oldKeyedNodes) {
        // アンマウントコールバックを実行
        for (const callback of keyedNode.unmountCallbacks) {
          callback();
        }
        // DOM から削除（まだ存在していれば）
        if (keyedNode.node.parentNode) {
          keyedNode.node.parentNode.removeChild(keyedNode.node);
        }
      }
      // childCtx.keyedNodes には新しく登録された keyed nodes が入っているので、クリアしない

      // マウントコールバックを実行
      executeMount(childCtx);
    },
  };

  // 子要素を処理（再利用時は子要素もクリアして再構築）
  if (isReused) {
    node.innerHTML = "";
  }

  if (element.children) {
    processIterator(
      element.children as Iterator<Child, void, Slot | void>,
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

    // まずプラグインをチェック
    if (value && typeof value === "object" && "type" in value) {
      const type = (value as { type: string }).type;
      const plugin = ctx.plugins.get(type);

      if (plugin) {
        const api = createPluginAPI(ctx);
        const pluginResult = plugin.process(value as Child, api);
        result = iter.next(pluginResult.value as Slot | void);
        continue;
      }
    }

    // 組み込みハンドラ
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
    } else {
      // 未知の type はスキップ
      result = iter.next();
    }
  }
}

function render(
  gen: Render,
  parent: HTMLElement,
  plugins: Map<string, DomPlugin>
): void {
  parent.innerHTML = "";

  const ctx = createRenderContext(parent, null, undefined, undefined, plugins);

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
export function mount(
  app: Component,
  parent: HTMLElement,
  options?: MountOptions
): void {
  // プラグインを Map に変換（type -> plugin）
  const plugins = new Map<string, DomPlugin>();

  if (options?.plugins) {
    for (const plugin of options.plugins) {
      for (const type of plugin.types) {
        plugins.set(type, plugin);
      }
    }
  }

  render(app(), parent, plugins);
}

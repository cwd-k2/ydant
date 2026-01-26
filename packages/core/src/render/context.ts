/**
 * @ydant/core - RenderContext 管理
 */

import type { Builder, Instructor } from "../types";
import { toChildren } from "../utils";
import type { Plugin, PluginAPI } from "../plugin";
import type { RenderContext } from "./types";
import { executeMount } from "./lifecycle";

/** RenderContext を作成 */
export function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  keyedNodes?: Map<string | number, unknown>,
  contextValues?: Map<symbol, unknown>,
  plugins?: Map<string, Plugin>,
  isCurrentElementReused?: boolean,
): RenderContext {
  return {
    parent,
    currentElement,
    isCurrentElementReused: isCurrentElementReused ?? false,
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
 *
 * processIterator を循環参照で受け取る必要があるため、
 * ファクトリ関数として実装
 */
export function createPluginAPIFactory(
  processIterator: (iter: Instructor, ctx: RenderContext) => void,
) {
  return function createPluginAPI(ctx: RenderContext): PluginAPI {
    return {
      // ========================================================================
      // 基本機能
      // ========================================================================
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
        builder: Builder,
        options?: { parent?: Node; inheritContext?: boolean },
      ): void {
        const targetParent = options?.parent ?? ctx.parent;
        const inheritContext = options?.inheritContext ?? true;

        const childCtx = createRenderContext(
          targetParent,
          targetParent instanceof globalThis.Element ? targetParent : null,
          undefined,
          inheritContext ? new Map(ctx.contextValues) : new Map(),
          ctx.plugins,
        );

        const children = toChildren(builder());
        processIterator(children, childCtx);

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
          ctx.plugins,
        );
        return createPluginAPI(childCtx);
      },

      // ========================================================================
      // base プラグイン用の拡張機能
      // これらは PluginAPIExtensions を通じて利用可能になる
      // ========================================================================
      get pendingKey() {
        return ctx.pendingKey;
      },
      setPendingKey(key: string | number | null): void {
        ctx.pendingKey = key;
      },
      get isCurrentElementReused() {
        return ctx.isCurrentElementReused;
      },
      getKeyedNode(key: string | number) {
        return ctx.keyedNodes.get(key);
      },
      setKeyedNode(key: string | number, node: unknown): void {
        ctx.keyedNodes.set(key, node);
      },
      deleteKeyedNode(key: string | number): void {
        ctx.keyedNodes.delete(key);
      },
      pushUnmountCallbacks(...callbacks: Array<() => void>): void {
        ctx.unmountCallbacks.push(...callbacks);
      },
      executeMount(): void {
        executeMount(ctx);
      },
      setCurrentElement(element: globalThis.Element | null): void {
        ctx.currentElement = element;
      },
      setParent(parent: Node): void {
        ctx.parent = parent;
      },
    } as PluginAPI;
  };
}

/**
 * @ydant/core - RenderContext 管理
 */

import type { Builder, Instructor } from "../types";
import { toChildren } from "../utils";
import type { Plugin, PluginAPI } from "../plugin";
import type { RenderContext, RenderContextCore } from "./types";
import { executeMount } from "./lifecycle";

/** RenderContext のコア部分を作成 */
export function createRenderContextCore(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
  isCurrentElementReused?: boolean,
): RenderContextCore {
  return {
    parent,
    currentElement,
    isCurrentElementReused: isCurrentElementReused ?? false,
    mountCallbacks: [],
    unmountCallbacks: [],
    plugins,
  };
}

/**
 * RenderContext を作成し、各プラグインで初期化
 *
 * @param parent - 親ノード
 * @param currentElement - 現在の要素
 * @param plugins - 登録されたプラグイン
 * @param parentCtx - 親コンテキスト（子コンテキスト作成時）
 * @param isCurrentElementReused - 要素が再利用されたかどうか
 */
export function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
  parentCtx?: RenderContext,
  isCurrentElementReused?: boolean,
): RenderContext {
  const ctx = createRenderContextCore(
    parent,
    currentElement,
    plugins,
    isCurrentElementReused,
  ) as RenderContext;

  // 各プラグインの initContext を呼び出し
  const calledPlugins = new Set<string>();
  for (const plugin of plugins.values()) {
    if (calledPlugins.has(plugin.name)) continue;
    calledPlugins.add(plugin.name);
    plugin.initContext?.(
      ctx as unknown as Record<string, unknown>,
      parentCtx as unknown as Record<string, unknown>,
    );
  }

  return ctx;
}

/**
 * RenderContext から PluginAPI を作成
 *
 * processIterator を循環参照で受け取る必要があるため、
 * ファクトリ関数として実装
 *
 * NOTE: core は基本的な API のみを提供し、プラグイン固有のメソッドは
 * 各プラグインの extendAPI で追加される。
 */
export function createPluginAPIFactory(
  processIterator: (iter: Instructor, ctx: RenderContext) => void,
) {
  return function createPluginAPI(ctx: RenderContext): PluginAPI {
    const api: Record<string, unknown> = {
      // ========================================================================
      // コア機能（全プラグインで使用可能）
      // ========================================================================
      get parent() {
        return ctx.parent;
      },
      get currentElement() {
        return ctx.currentElement;
      },
      get isCurrentElementReused() {
        return ctx.isCurrentElementReused;
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
      processChildren(
        builder: Builder,
        options?: { parent?: Node; inheritContext?: boolean },
      ): void {
        const targetParent = options?.parent ?? ctx.parent;

        const childCtx = createRenderContext(
          targetParent,
          targetParent instanceof globalThis.Element ? targetParent : null,
          ctx.plugins,
          ctx,
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
          ctx.plugins,
          ctx,
        );
        return createPluginAPI(childCtx);
      },
    };

    // 各プラグインの extendAPI を呼び出して API を拡張
    const calledPlugins = new Set<string>();
    for (const plugin of ctx.plugins.values()) {
      if (calledPlugins.has(plugin.name)) continue;
      calledPlugins.add(plugin.name);
      plugin.extendAPI?.(api, ctx as unknown as Record<string, unknown>);
    }

    return api as unknown as PluginAPI;
  };
}

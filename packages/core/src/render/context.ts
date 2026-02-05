/**
 * @ydant/core - RenderContext 管理
 */

import type { Builder, Instructor } from "../types";
import { toChildren } from "../utils";
import type { Plugin, PluginAPI, PluginAPIExtensions } from "../plugin";
import type { RenderContext, RenderContextCore } from "./types";

/**
 * 登録されたプラグインをユニークに反復処理する
 * （同じプラグインが複数の type で登録されている場合、1回だけ呼び出す）
 */
function forEachUniquePlugin(
  plugins: Map<string, Plugin>,
  callback: (plugin: Plugin) => void,
): void {
  const visited = new Set<string>();
  for (const plugin of plugins.values()) {
    if (visited.has(plugin.name)) continue;
    visited.add(plugin.name);
    callback(plugin);
  }
}

/** RenderContext のコア部分を作成 */
export function createRenderContextCore(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
): RenderContextCore {
  return {
    parent,
    currentElement,
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
 */
export function createRenderContext(
  parent: Node,
  currentElement: globalThis.Element | null,
  plugins: Map<string, Plugin>,
  parentCtx?: RenderContext,
): RenderContext {
  const ctx = createRenderContextCore(parent, currentElement, plugins) as RenderContext;

  // 各プラグインの initContext を呼び出し
  forEachUniquePlugin(plugins, (plugin) => {
    plugin.initContext?.(ctx, parentCtx);
  });

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
    // キャッシュがあればそのまま返す
    if (ctx._cachedAPI) {
      return ctx._cachedAPI;
    }

    const api: Record<string, unknown> = {
      // ========================================================================
      // コア機能（プラグインが拡張する基盤）
      // ========================================================================
      get parent() {
        return ctx.parent;
      },
      get currentElement() {
        return ctx.currentElement;
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

        // 各プラグインの mergeChildContext を呼び出し
        forEachUniquePlugin(ctx.plugins, (plugin) => {
          plugin.mergeChildContext?.(ctx, childCtx);
        });
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
    forEachUniquePlugin(ctx.plugins, (plugin) => {
      plugin.extendAPI?.(api as Partial<PluginAPIExtensions>, ctx);
    });

    const pluginAPI = api as unknown as PluginAPI;
    ctx._cachedAPI = pluginAPI;
    return pluginAPI;
  };
}
